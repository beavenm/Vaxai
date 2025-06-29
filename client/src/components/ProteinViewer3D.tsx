import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Download, 
  Maximize, 
  Settings, 
  Eye, 
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';

interface ProteinAtom {
  x: number;
  y: number;
  z: number;
  element: string;
  residue: string;
  chain: string;
  residueNumber: number;
  atomName: string;
}

interface ProteinStructure {
  atoms: ProteinAtom[];
  chains: string[];
  title: string;
  resolution?: number;
}

interface ProteinViewer3DProps {
  sequence: string;
  proteinName: string;
  onStructureLoad?: (structure: ProteinStructure) => void;
}

export default function ProteinViewer3D({ sequence, proteinName, onStructureLoad }: ProteinViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const proteinGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<any>(null);
  
  const [viewMode, setViewMode] = useState<'cartoon' | 'surface' | 'atoms' | 'backbone'>('cartoon');
  const [colorScheme, setColorScheme] = useState<'chain' | 'residue' | 'structure' | 'hydrophobicity'>('structure');
  const [isLoading, setIsLoading] = useState(true);
  const [structure, setStructure] = useState<ProteinStructure | null>(null);
  const [zoom, setZoom] = useState([50]);
  const [rotationSpeed, setRotationSpeed] = useState([1]);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-1, -1, -1);
    scene.add(pointLight);

    // Add basic controls
    setupMouseControls();

    // Generate mock protein structure from sequence
    generateProteinStructure();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const setupMouseControls = () => {
    if (!mountRef.current || !cameraRef.current) return;

    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    const rotationSensitivity = 0.005;

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !proteinGroupRef.current) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      proteinGroupRef.current.rotation.y += deltaX * rotationSensitivity;
      proteinGroupRef.current.rotation.x += deltaY * rotationSensitivity;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (event: WheelEvent) => {
      if (!cameraRef.current) return;
      
      const zoomSpeed = 0.1;
      const newZ = cameraRef.current.position.z + event.deltaY * zoomSpeed;
      cameraRef.current.position.z = Math.max(10, Math.min(200, newZ));
    };

    mountRef.current.addEventListener('mousedown', handleMouseDown);
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('mouseup', handleMouseUp);
    mountRef.current.addEventListener('wheel', handleWheel);
  };

  const generateProteinStructure = async () => {
    if (!sceneRef.current) return;

    setIsLoading(true);

    // Create a mock protein structure from the sequence
    const atoms: ProteinAtom[] = [];
    const aminoAcids = sequence.match(/.{1,3}/g) || [];
    
    // Generate a realistic protein fold using simple secondary structure rules
    let x = 0, y = 0, z = 0;
    let phi = 0, psi = 0; // Backbone dihedral angles
    
    aminoAcids.forEach((residue, index) => {
      // Alpha helix parameters (simplified)
      if (index % 10 < 7) { // 70% alpha helix
        phi = -60 * Math.PI / 180;
        psi = -45 * Math.PI / 180;
      } else { // 30% beta sheet
        phi = -120 * Math.PI / 180;
        psi = 120 * Math.PI / 180;
      }
      
      // Add some randomness for realistic structure
      const noise = 0.2;
      x += 3.8 * Math.cos(phi) + (Math.random() - 0.5) * noise;
      y += 3.8 * Math.sin(psi) + (Math.random() - 0.5) * noise;
      z += 1.5 * Math.sin(index * 0.1) + (Math.random() - 0.5) * noise;

      atoms.push({
        x, y, z,
        element: 'C',
        residue: getThreeLetterCode(residue),
        chain: 'A',
        residueNumber: index + 1,
        atomName: 'CA'
      });
    });

    const mockStructure: ProteinStructure = {
      atoms,
      chains: ['A'],
      title: proteinName,
      resolution: 2.1
    };

    setStructure(mockStructure);
    renderProteinStructure(mockStructure);
    onStructureLoad?.(mockStructure);
    setIsLoading(false);
  };

  const getThreeLetterCode = (residue: string): string => {
    const codes: { [key: string]: string } = {
      'A': 'ALA', 'R': 'ARG', 'N': 'ASN', 'D': 'ASP', 'C': 'CYS',
      'E': 'GLU', 'Q': 'GLN', 'G': 'GLY', 'H': 'HIS', 'I': 'ILE',
      'L': 'LEU', 'K': 'LYS', 'M': 'MET', 'F': 'PHE', 'P': 'PRO',
      'S': 'SER', 'T': 'THR', 'W': 'TRP', 'Y': 'TYR', 'V': 'VAL'
    };
    return codes[residue] || 'UNK';
  };

  const renderProteinStructure = (structure: ProteinStructure) => {
    if (!sceneRef.current) return;

    // Clear previous structure
    if (proteinGroupRef.current) {
      sceneRef.current.remove(proteinGroupRef.current);
    }

    const proteinGroup = new THREE.Group();
    proteinGroupRef.current = proteinGroup;

    switch (viewMode) {
      case 'cartoon':
        renderCartoon(structure, proteinGroup);
        break;
      case 'surface':
        renderSurface(structure, proteinGroup);
        break;
      case 'atoms':
        renderAtoms(structure, proteinGroup);
        break;
      case 'backbone':
        renderBackbone(structure, proteinGroup);
        break;
    }

    sceneRef.current.add(proteinGroup);

    // Center the structure
    const box = new THREE.Box3().setFromObject(proteinGroup);
    const center = box.getCenter(new THREE.Vector3());
    proteinGroup.position.sub(center);
  };

  const renderCartoon = (structure: ProteinStructure, group: THREE.Group) => {
    const points = structure.atoms.map(atom => new THREE.Vector3(atom.x, atom.y, atom.z));
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Create tube geometry for cartoon representation
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, 1.5, 8, false);
    const material = new THREE.MeshPhongMaterial({ 
      color: getColorForResidue('cartoon'),
      shininess: 100
    });
    
    const tube = new THREE.Mesh(tubeGeometry, material);
    group.add(tube);

    // Add secondary structure elements
    addSecondaryStructureElements(structure, group);
  };

  const renderSurface = (structure: ProteinStructure, group: THREE.Group) => {
    // Create molecular surface using sphere approximation
    const spheres: THREE.Mesh[] = [];
    
    structure.atoms.forEach((atom, index) => {
      const radius = getAtomRadius(atom.element);
      const geometry = new THREE.SphereGeometry(radius * 2, 16, 16);
      const material = new THREE.MeshLambertMaterial({ 
        color: getColorForAtom(atom),
        transparent: true,
        opacity: 0.7
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.x, atom.y, atom.z);
      spheres.push(sphere);
      group.add(sphere);
    });
  };

  const renderAtoms = (structure: ProteinStructure, group: THREE.Group) => {
    structure.atoms.forEach(atom => {
      const radius = getAtomRadius(atom.element);
      const geometry = new THREE.SphereGeometry(radius, 12, 12);
      const material = new THREE.MeshPhongMaterial({ 
        color: getColorForAtom(atom),
        shininess: 100
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.x, atom.y, atom.z);
      group.add(sphere);
    });

    // Add bonds
    for (let i = 0; i < structure.atoms.length - 1; i++) {
      const atom1 = structure.atoms[i];
      const atom2 = structure.atoms[i + 1];
      
      if (atom1.residueNumber === atom2.residueNumber || 
          Math.abs(atom1.residueNumber - atom2.residueNumber) === 1) {
        addBond(atom1, atom2, group);
      }
    }
  };

  const renderBackbone = (structure: ProteinStructure, group: THREE.Group) => {
    const points = structure.atoms.map(atom => new THREE.Vector3(atom.x, atom.y, atom.z));
    
    // Create line geometry for backbone
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x4a90e2,
      linewidth: 3
    });
    
    const line = new THREE.Line(geometry, material);
    group.add(line);

    // Add small spheres at residue positions
    structure.atoms.forEach(atom => {
      const geometry = new THREE.SphereGeometry(0.5, 8, 8);
      const material = new THREE.MeshPhongMaterial({ 
        color: getColorForResidue(atom.residue)
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.x, atom.y, atom.z);
      group.add(sphere);
    });
  };

  const addSecondaryStructureElements = (structure: ProteinStructure, group: THREE.Group) => {
    // Add alpha helices as cylinders
    let helixStart = 0;
    for (let i = 0; i < structure.atoms.length - 3; i++) {
      if (i % 10 === 7) { // End of helix
        if (i - helixStart >= 3) {
          addAlphaHelix(structure.atoms.slice(helixStart, i + 1), group);
        }
        helixStart = i + 1;
      }
    }
  };

  const addAlphaHelix = (atoms: ProteinAtom[], group: THREE.Group) => {
    if (atoms.length < 3) return;

    const start = new THREE.Vector3(atoms[0].x, atoms[0].y, atoms[0].z);
    const end = new THREE.Vector3(atoms[atoms.length - 1].x, atoms[atoms.length - 1].y, atoms[atoms.length - 1].z);
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    const geometry = new THREE.CylinderGeometry(2, 2, length, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.8
    });
    
    const helix = new THREE.Mesh(geometry, material);
    helix.position.copy(start.clone().add(end).multiplyScalar(0.5));
    helix.lookAt(end);
    helix.rotateX(Math.PI / 2);
    
    group.add(helix);
  };

  const addBond = (atom1: ProteinAtom, atom2: ProteinAtom, group: THREE.Group) => {
    const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
    const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    if (length > 3.0) return; // Skip if too far apart
    
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, length, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    const bond = new THREE.Mesh(geometry, material);
    bond.position.copy(start.clone().add(end).multiplyScalar(0.5));
    bond.lookAt(end);
    bond.rotateX(Math.PI / 2);
    
    group.add(bond);
  };

  const getAtomRadius = (element: string): number => {
    const radii: { [key: string]: number } = {
      'H': 0.5, 'C': 0.7, 'N': 0.65, 'O': 0.6, 'S': 1.0, 'P': 1.0
    };
    return radii[element] || 0.7;
  };

  const getColorForAtom = (atom: ProteinAtom): number => {
    const colors: { [key: string]: number } = {
      'C': 0x909090, 'N': 0x3050f8, 'O': 0xff0d0d, 'S': 0xffff30, 'P': 0xff8000
    };
    return colors[atom.element] || 0x909090;
  };

  const getColorForResidue = (residue: string): number => {
    const colors: { [key: string]: number } = {
      'ALA': 0xc8c8c8, 'ARG': 0x145aff, 'ASN': 0x00dcdc, 'ASP': 0xe60a0a,
      'CYS': 0xe6e600, 'GLU': 0xe60a0a, 'GLN': 0x00dcdc, 'GLY': 0xebebeb,
      'HIS': 0x8282d2, 'ILE': 0x0f820f, 'LEU': 0x0f820f, 'LYS': 0x145aff,
      'MET': 0xe6e600, 'PHE': 0x3232aa, 'PRO': 0xdc9682, 'SER': 0xfa9600,
      'THR': 0xfa9600, 'TRP': 0xb45ab4, 'TYR': 0x3232aa, 'VAL': 0x0f820f,
      'cartoon': 0x4a90e2
    };
    return colors[residue] || 0x909090;
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (isAutoRotating && proteinGroupRef.current) {
        proteinGroupRef.current.rotation.y += 0.005 * rotationSpeed[0];
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
  }, [isAutoRotating, rotationSpeed]);

  // Update visualization when parameters change
  useEffect(() => {
    if (structure) {
      renderProteinStructure(structure);
    }
  }, [viewMode, colorScheme]);

  const resetView = () => {
    if (cameraRef.current && proteinGroupRef.current) {
      cameraRef.current.position.set(0, 0, 100);
      proteinGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  const downloadImage = () => {
    if (!rendererRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${proteinName}_structure.png`;
    link.href = rendererRef.current.domElement.toDataURL();
    link.click();
  };

  return (
    <Card className="result-card rounded-3xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Eye className="text-white w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-sf-pro">3D Protein Structure</CardTitle>
              {structure && (
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{structure.atoms.length} atoms</Badge>
                  {structure.resolution && (
                    <Badge variant="outline">{structure.resolution}Å resolution</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadImage}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50/70 rounded-xl">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">View Mode</label>
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cartoon">Cartoon</SelectItem>
                <SelectItem value="surface">Surface</SelectItem>
                <SelectItem value="atoms">Ball & Stick</SelectItem>
                <SelectItem value="backbone">Backbone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Color Scheme</label>
            <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structure">Secondary Structure</SelectItem>
                <SelectItem value="chain">By Chain</SelectItem>
                <SelectItem value="residue">By Residue</SelectItem>
                <SelectItem value="hydrophobicity">Hydrophobicity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Rotation Speed: {rotationSpeed[0]}x
            </label>
            <Slider
              value={rotationSpeed}
              onValueChange={setRotationSpeed}
              min={0.1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              variant={isAutoRotating ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className="w-full"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Auto Rotate
            </Button>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="relative">
          <div 
            ref={mountRef} 
            className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200"
            style={{ minHeight: '400px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Generating 3D structure...</p>
              </div>
            </div>
          )}
        </div>

        {/* Structure Info */}
        {structure && (
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{structure.chains.length}</div>
              <div className="text-sm text-gray-600">Chains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sequence.length}</div>
              <div className="text-sm text-gray-600">Residues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(structure.atoms.length * 6.022e23 / 1e23).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">×10²³ Atoms</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full text-xs">
            <Palette className="w-3 h-3 mr-1" />
            Export Scene
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Advanced Settings
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs">
            <ZoomIn className="w-3 h-3 mr-1" />
            Focus Region
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}