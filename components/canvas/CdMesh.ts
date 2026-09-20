import * as THREE from 'three';

export interface CdCaseOptions {
  texture: THREE.CanvasTexture;
  title: string;
  onClick: () => void;
  position: [number, number, number];
}

export class CdCaseMesh {
  public group: THREE.Group;
  public jewelCase: THREE.Mesh;
  public artworkMesh: THREE.Mesh;
  public spineMesh: THREE.Mesh;
  public targetRotation = { x: 0, y: 0 };
  public currentRotation = { x: 0, y: 0 };
  public hovered = false;
  public basePosition: [number, number, number];
  public onClick: () => void;

  constructor(options: CdCaseOptions) {
    this.basePosition = options.position;
    this.onClick = options.onClick;
    this.group = new THREE.Group();
    this.group.position.set(...this.basePosition);

    const width = 2.4;
    const height = 2.4;
    const depth = 0.18;

    // 1. Transparent Acrylic Jewel Case Outer
    const caseGeo = new THREE.BoxGeometry(width, height, depth);
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      thickness: 0.4,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    this.jewelCase = new THREE.Mesh(caseGeo, caseMat);
    this.jewelCase.userData = { isCd: true, parentCase: this };
    this.group.add(this.jewelCase);

    // 2. CD Artwork Insert
    const artGeo = new THREE.PlaneGeometry(width * 0.92, height * 0.92);
    const artMat = new THREE.MeshBasicMaterial({
      map: options.texture,
      side: THREE.FrontSide,
    });
    this.artworkMesh = new THREE.Mesh(artGeo, artMat);
    this.artworkMesh.position.z = depth * 0.15;
    this.artworkMesh.userData = { isCd: true, parentCase: this };
    this.group.add(this.artworkMesh);

    // Back cover
    const backGeo = new THREE.PlaneGeometry(width * 0.92, height * 0.92);
    const backMat = new THREE.MeshBasicMaterial({
      color: 0x050208,
      side: THREE.BackSide,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.z = -depth * 0.15;
    this.group.add(backMesh);

    // 3. Black Plastic Spine on Left Edge
    const spineGeo = new THREE.BoxGeometry(0.12, height, depth * 0.9);
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
    });
    this.spineMesh = new THREE.Mesh(spineGeo, spineMat);
    this.spineMesh.position.x = -width / 2 + 0.06;
    this.group.add(this.spineMesh);
  }

  update(time: number, delta: number) {
    // Floating motion
    const floatOffset = Math.sin(time * 2 + this.basePosition[0]) * 0.08;
    this.group.position.y = this.basePosition[1] + floatOffset;

    // Smooth hover tilt & rotation
    const lerpSpeed = 0.1;
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * lerpSpeed;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * lerpSpeed;

    this.group.rotation.x = this.currentRotation.x;
    this.group.rotation.y = this.currentRotation.y;

    if (this.hovered) {
      // Subtle glowing pulsation on hover
      this.group.scale.lerp(new THREE.Vector3(1.08, 1.08, 1.08), 0.1);
    } else {
      this.group.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.1);
    }
  }

  setHover(hovered: boolean, mouseX = 0, mouseY = 0) {
    this.hovered = hovered;
    if (hovered) {
      this.targetRotation.y = (mouseX - this.basePosition[0]) * 0.4;
      this.targetRotation.x = -(mouseY - this.basePosition[1]) * 0.3;
    } else {
      this.targetRotation.x = 0;
      this.targetRotation.y = this.basePosition[0] < 0 ? 0.2 : -0.2; // slight natural 3D angle
    }
  }
}
