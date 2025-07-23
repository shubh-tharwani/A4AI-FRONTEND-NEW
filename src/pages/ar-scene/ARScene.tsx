import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  CubeIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import * as THREE from 'three';
import Navigation from '../../components/layout/Navigation';
import { ARSceneRequest, ARSceneResponse } from '../../types';
import { cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { validateObject, ARSceneValidationSchema, showValidationErrors } from '../../utils/validation';

type ViewMode = 'create' | 'scene' | 'gallery';
type DeviceType = 'desktop' | 'mobile';

interface ARState {
  currentScene: ARSceneResponse | null;
  savedScenes: ARSceneResponse[];
  isPlaying: boolean;
  deviceType: DeviceType;
  sceneObjects: THREE.Object3D[];
}

export default function ARScene() {
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [loading, setLoading] = useState(false);
  const [arState, setARState] = useState<ARState>({
    currentScene: null,
    savedScenes: [],
    isPlaying: false,
    deviceType: 'desktop',
    sceneObjects: [],
  });

  const sceneRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneObjectRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ARSceneRequest>({
    defaultValues: {
      topic: '',
      grade_level: 9,
    }
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!sceneRef.current || viewMode !== 'scene' || !arState.currentScene) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, sceneRef.current.offsetWidth / sceneRef.current.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(sceneRef.current.offsetWidth, sceneRef.current.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    sceneRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add demo objects based on scene
    createSceneObjects(scene, arState.currentScene);

    camera.position.z = 5;

    sceneObjectRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const animate = () => {
      if (!rendererRef.current || !sceneObjectRef.current || !cameraRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);

      // Rotate objects if playing
      if (arState.isPlaying) {
        scene.children.forEach((child) => {
          if (child.type === 'Mesh' || child.type === 'Group') {
            child.rotation.y += 0.01;
          }
        });
      }

      rendererRef.current.render(sceneObjectRef.current, cameraRef.current);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = sceneRef.current.offsetWidth;
      const height = sceneRef.current.offsetHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && sceneRef.current) {
        sceneRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, arState.currentScene, arState.isPlaying]);

  const createSceneObjects = (scene: THREE.Scene, sceneData: ARSceneResponse) => {
    // Create demo 3D objects based on scene description
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffa726, 0xab47bc];
    
    sceneData.objects.forEach((obj, index) => {
      const geometry = getGeometryForObject(obj.name);
      const material = new THREE.MeshPhongMaterial({ color: colors[index % colors.length] });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position objects in a circle
      const angle = (index / sceneData.objects.length) * Math.PI * 2;
      mesh.position.x = Math.cos(angle) * 2;
      mesh.position.z = Math.sin(angle) * 2;
      mesh.position.y = Math.random() * 2 - 1;
      
      scene.add(mesh);
    });
  };

  const getGeometryForObject = (objectName: string): THREE.BufferGeometry => {
    // Return different geometries based on object type
    if (objectName.toLowerCase().includes('sphere') || objectName.toLowerCase().includes('ball')) {
      return new THREE.SphereGeometry(0.5, 32, 32);
    } else if (objectName.toLowerCase().includes('cube') || objectName.toLowerCase().includes('box')) {
      return new THREE.BoxGeometry(1, 1, 1);
    } else if (objectName.toLowerCase().includes('cylinder')) {
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    } else {
      return new THREE.TetrahedronGeometry(0.7);
    }
  };

  const generateARScene = async (data: ARSceneRequest) => {
    try {
      setLoading(true);
      console.log('📤 Making AR scene request with data:', data);

      // Comprehensive input validation
      const validation = validateObject(data, ARSceneValidationSchema);
      
      if (!validation.isValid) {
        showValidationErrors(validation.errors);
        return;
      }

      // Additional business logic validation
      if (!data.topic || data.topic.trim().length < 5) {
        toast.error('Please provide a detailed topic description (at least 5 characters).');
        return;
      }

      if (data.grade_level && (data.grade_level < 1 || data.grade_level > 12)) {
        toast.error('Please select a valid grade level between 1 and 12.');
        return;
      }

      // Sanitize and prepare request data
      const sanitizedData = {
        topic: data.topic.trim(),
        grade_level: data.grade_level || 5
      };

      const response = await ApiService.Activities.createARScene(sanitizedData);
      
      console.log('📥 AR Scene API response:', response);
      
      // Enhanced response validation
      if (!response) {
        throw new Error('No response received from server');
      }

      if (response && response.scene_id) {
        // Validate scene structure
        if (!response.scene_name && !response.educational_objective) {
          throw new Error('AR scene missing essential components');
        }

        const validatedScene = {
          ...response,
          scene_name: response.scene_name || `AR Scene: ${sanitizedData.topic}`,
          educational_objective: response.educational_objective || `Learn about ${sanitizedData.topic}`,
          environment: response.environment || {
            setting: 'Default virtual environment',
            lighting: 'Natural lighting',
            atmosphere: 'Educational setting',
            size_scale: 'Medium'
          },
          objects: Array.isArray(response.objects) ? response.objects.filter(obj => 
            obj && obj.name && obj.description
          ) : [],
          interactions: Array.isArray(response.interactions) ? response.interactions.filter(interaction => 
            interaction && interaction.type && interaction.description
          ) : [],
          technical_requirements: Array.isArray(response.technical_requirements) ? 
            response.technical_requirements : ['AR-capable device', 'Good lighting conditions'],
          assessment_opportunities: Array.isArray(response.assessment_opportunities) ? 
            response.assessment_opportunities : ['Observation of student engagement'],
          grade_level: sanitizedData.grade_level,
          subject_area: response.subject_area || 'General Education'
        };

        if (validatedScene.objects.length === 0) {
          console.warn('No valid objects in AR scene, adding default objects');
          validatedScene.objects = [{
            name: 'Educational Model',
            description: `Interactive 3D model related to ${sanitizedData.topic}`,
            interactions: ['Touch to explore', 'Rotate to view'],
            learning_purpose: `Visual understanding of ${sanitizedData.topic}`
          }];
        }

        if (validatedScene.interactions.length === 0) {
          console.warn('No valid interactions in AR scene, adding default interactions');
          validatedScene.interactions = [{
            type: 'Touch Interaction',
            description: 'Touch objects to learn more about them',
            learning_outcome: `Enhanced understanding of ${sanitizedData.topic}`,
            feedback_mechanism: 'Visual and audio feedback'
          }];
        }

        setARState(prev => ({
          ...prev,
          currentScene: validatedScene,
          savedScenes: [...prev.savedScenes, validatedScene],
        }));
        setViewMode('scene');
        toast.success(`AR scene "${validatedScene.scene_name}" created successfully!`);
      } else {
        console.error('Invalid AR scene structure:', response);
        toast.error('Invalid AR scene data received from server. Please try again.');
      }
    } catch (error: any) {
      console.error('AR scene generation error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate AR scene';
      toast.error(`AR scene generation failed: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    setARState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const resetScene = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const renderNavigation = () => (
    <div className="flex space-x-4 mb-8">
      {[
        { id: 'create' as ViewMode, name: 'Create Scene', icon: CubeIcon },
        { id: 'scene' as ViewMode, name: 'Current Scene', icon: EyeIcon },
        { id: 'gallery' as ViewMode, name: 'My Scenes', icon: AdjustmentsHorizontalIcon },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setViewMode(tab.id)}
          disabled={tab.id === 'scene' && !arState.currentScene}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
            viewMode === tab.id
              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            tab.id === 'scene' && !arState.currentScene && "opacity-50 cursor-not-allowed"
          )}
        >
          <tab.icon className="w-5 h-5" />
          <span>{tab.name}</span>
        </button>
      ))}
    </div>
  );

  const renderCreateForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CubeIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create AR Learning Scene</h2>
          <p className="text-gray-600">Design immersive 3D educational experiences</p>
        </div>

        <form onSubmit={handleSubmit(generateARScene)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to explore in AR?
            </label>
            <textarea
              {...register('topic', { 
                required: 'Topic is required',
                minLength: { value: 5, message: 'Topic must be at least 5 characters' }
              })}
              rows={4}
              placeholder="e.g., Solar system with planets orbiting the sun, Human anatomy showing skeletal and circulatory systems, Chemical molecular structures and reactions"
              className="input-field resize-none"
            />
            {errors.topic && (
              <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <select
              {...register('grade_level')}
              className="input-field"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">AR Experience Requirements</p>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                  <li>Modern browser with WebGL support</li>
                  <li>Camera access for mobile AR features</li>
                  <li>Adequate lighting for best experience</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-3" />
                Creating AR Scene...
              </>
            ) : (
              <>
                <CubeIcon className="w-6 h-6 mr-3" />
                Generate AR Scene
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderARScene = () => {
    if (!arState.currentScene) {
      return (
        <div className="text-center py-12">
          <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AR scene loaded</h3>
          <p className="text-gray-600 mb-6">Create a new AR scene to get started</p>
          <button
            onClick={() => setViewMode('create')}
            className="btn-primary"
          >
            Create AR Scene
          </button>
        </div>
      );
    }

    const scene = arState.currentScene;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Scene Header */}
        <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{scene.scene_name}</h2>
              <p className="text-gray-600">{scene.educational_objective}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setARState(prev => ({ ...prev, deviceType: 'desktop' }))}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    arState.deviceType === 'desktop'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <ComputerDesktopIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setARState(prev => ({ ...prev, deviceType: 'mobile' }))}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    arState.deviceType === 'mobile'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <DevicePhoneMobileIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Scene Viewer */}
        <div className="bg-gray-900 rounded-none border-x border-gray-200 relative">
          <div
            ref={sceneRef}
            className="w-full h-96 relative"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          />
          
          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlayback}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-3 rounded-full transition-all"
              >
                {arState.isPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={resetScene}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-3 rounded-full transition-all"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {arState.deviceType === 'mobile' ? 'Mobile View' : 'Desktop View'}
            </div>
          </div>
        </div>

        {/* Scene Information */}
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Environment Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Setting:</span>
                  <p className="text-sm text-gray-900">{scene.environment.setting}</p>
                </div>
                {scene.environment.lighting && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Lighting:</span>
                    <p className="text-sm text-gray-900">{scene.environment.lighting}</p>
                  </div>
                )}
                {scene.environment.atmosphere && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Atmosphere:</span>
                    <p className="text-sm text-gray-900">{scene.environment.atmosphere}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Objects */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Objects</h3>
              <div className="space-y-3">
                {scene.objects && scene.objects.slice(0, 3).map((obj, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{obj.name}</h4>
                    <p className="text-xs text-gray-600">{obj.learning_purpose}</p>
                  </div>
                ))}
                {scene.objects && scene.objects.length > 3 && (
                  <p className="text-sm text-gray-600">
                    +{scene.objects.length - 3} more objects...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Interactions */}
          {scene.interactions && scene.interactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Interactions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scene.interactions && scene.interactions.map((interaction, index) => (
                  <div key={index} className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">
                      {interaction.type}
                    </h4>
                    <p className="text-sm text-indigo-800 mb-2">{interaction.description}</p>
                    <p className="text-xs text-indigo-600">{interaction.learning_outcome}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={() => setViewMode('create')}
              className="btn-secondary"
            >
              Create New Scene
            </button>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {arState.isPlaying ? 'Animation Playing' : 'Animation Paused'}
              </span>
              <div className={cn(
                "w-2 h-2 rounded-full",
                arState.isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderGallery = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My AR Scenes</h2>
        <button
          onClick={() => setViewMode('create')}
          className="btn-primary"
        >
          Create New Scene
        </button>
      </div>

      {arState.savedScenes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AR scenes created</h3>
          <p className="text-gray-600 mb-6">Create your first AR learning experience</p>
          <button
            onClick={() => setViewMode('create')}
            className="btn-primary"
          >
            Create AR Scene
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arState.savedScenes.map((scene) => (
            <motion.div
              key={scene.scene_id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <CubeIcon className="w-12 h-12 text-white opacity-80" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{scene.scene_name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scene.educational_objective}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {scene.objects.length} objects
                  </div>
                  <button
                    onClick={() => {
                      setARState(prev => ({ ...prev, currentScene: scene }));
                      setViewMode('scene');
                    }}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AR Learning Scenes</h1>
            <p className="text-gray-600">
              Create and explore immersive 3D educational experiences in augmented reality
            </p>
          </motion.div>
        </div>

        {/* Navigation */}
        {renderNavigation()}

        {/* Content */}
        {viewMode === 'create' && renderCreateForm()}
        {viewMode === 'scene' && renderARScene()}
        {viewMode === 'gallery' && renderGallery()}
      </div>
    </Navigation>
  );
}
