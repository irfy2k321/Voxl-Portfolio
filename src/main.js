import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

// Audio system with Howler.js
const sounds = {
  backgroundMusic: new Howl({
    src: ["/sfx/music.ogg"],
    loop: true,
    volume: 0.3,
    preload: false,
  }),
  projectsSFX: new Howl({
    src: ["/sfx/projects.ogg"],
    volume: 0.5,
    preload: false,
  }),
  pokemonSFX: new Howl({
    src: ["/sfx/pokemon.ogg"],
    volume: 0.5,
    preload: false,
  }),
  jumpSFX: new Howl({
    src: ["/sfx/jumpsfx.ogg"],
    volume: 1.0,
    preload: false,
  }),
};

let isMuted = false;
let audioInitialized = false;

function initializeAudio() {
  if (!audioInitialized) {
    // Load all sounds after user interaction
    Object.values(sounds).forEach(sound => {
      sound.load();
    });
    audioInitialized = true;
  }
}

function playSound(soundId) {
  if (!audioInitialized) {
    initializeAudio();
  }
  if (!isMuted && sounds[soundId]) {
    sounds[soundId].play();
  }
}

function stopSound(soundId) {
  if (sounds[soundId]) {
    sounds[soundId].stop();
  }
}

const aspect = window.innerWidth / window.innerHeight;

const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
scene.background = new THREE.Color(0xbcd38d);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace; 

const app = document.getElementById('app');
app.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera( -aspect*50, aspect*50, 50, -50, 1, 1000);
camera.position.set(-30, 50, -55);
camera.zoom = 2;
camera.updateProjectionMatrix();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enableRotate = false;
controls.enablePan = false;
controls.target.set(5, 5, -5);
controls.update();

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.castShadow = true;
sun.position.set(150, 200, 100);
sun.target.position.set(0, 0, 0);
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 600;
sun.shadow.camera.left = -200;
sun.shadow.camera.right = 200;
sun.shadow.camera.top = 200;
sun.shadow.camera.bottom = -200;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.05;
scene.add(sun);
scene.add(sun.target);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(-100, 80, -100);
scene.add(rimLight);

const musicToggleButton = document.querySelector("#music-toggle");
const themeToggleButton = document.querySelector("#theme-toggle");

function toggleMusic() {
  if (!audioInitialized) {
    initializeAudio();
  }
  
  isMuted = !isMuted;
  const musicIcon = musicToggleButton?.querySelector('.music-icon');
  
  if (isMuted) {
    sounds.backgroundMusic.pause();
    if (musicIcon) musicIcon.className = 'fas fa-volume-mute music-icon';
    musicToggleButton?.classList.add('active');
  } else {
    sounds.backgroundMusic.play();
    if (musicIcon) musicIcon.className = 'fas fa-volume-up music-icon';
    musicToggleButton?.classList.remove('active');
  }
  
  if (!isMuted) {
    playSound("projectsSFX");
  }
}

function toggleTheme() {
  if (!isMuted) {
    playSound("projectsSFX");
  }
  
  const isCurrentlyDark = document.body.classList.contains("dark-theme");
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");

  const themeIcon = themeToggleButton?.querySelector('.theme-icon');
  
  if (isCurrentlyDark) {
    // Switching to light theme
    if (themeIcon) themeIcon.className = 'fas fa-sun theme-icon';
    themeToggleButton?.classList.remove('active');
    scene.background = new THREE.Color(0xbcd38d);
  } else {
    // Switching to dark theme
    if (themeIcon) themeIcon.className = 'fas fa-moon theme-icon';
    themeToggleButton?.classList.add('active');
    scene.background = new THREE.Color(0x1a1a2e);
  }

  // Animate lighting changes for day/night cycle
  if (typeof gsap !== 'undefined') {
    gsap.to(ambientLight.color, {
      r: isCurrentlyDark ? 1.0 : 0.25,
      g: isCurrentlyDark ? 1.0 : 0.31,
      b: isCurrentlyDark ? 1.0 : 0.78,
      ease: "power2.inOut",
    });
    gsap.to(ambientLight, {
      intensity: isCurrentlyDark ? 0.8 : 0.9,
      ease: "power2.inOut",
    });
    gsap.to(sun, {
      intensity: isCurrentlyDark ? 1 : 0.8,
      ease: "power2.inOut",
    });
    gsap.to(sun.color, {
      r: isCurrentlyDark ? 1.0 : 0.25,
      g: isCurrentlyDark ? 1.0 : 0.41,
      b: isCurrentlyDark ? 1.0 : 0.88,
      ease: "power2.inOut",
    });
  } else {
    // Fallback without GSAP animations
    if (!isCurrentlyDark) {
      ambientLight.color.setRGB(0.25, 0.31, 0.78);
      ambientLight.intensity = 0.9;
      sun.intensity = 0.8;
      sun.color.setRGB(0.25, 0.41, 0.88);
    } else {
      ambientLight.color.setRGB(1.0, 1.0, 1.0);
      ambientLight.intensity = 0.8;
      sun.intensity = 1.0;
      sun.color.setRGB(1.0, 1.0, 1.0);
    }
  }
}

const clock = new THREE.Clock();

const GRAVITY = 30;
const CAPSULE_RADIUS = 0.8;
const CAPSULE_HEIGHT = 1.2;
const JUMP_HEIGHT = 18;
const MOVE_SPEED = 16;

const colliderOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, CAPSULE_RADIUS, 0),
  new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  CAPSULE_RADIUS
);

let character = {
    instance: null,
    spawnPosition: new THREE.Vector3(),
    isMoving: false,
    lastHopTime: 0,
    hopCooldown: 300,
};
let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const pressedButtons = { up: false, left: false, right: false, down: false };
let targetRotation = 0;
const intersectObjects = [];
const intersectObjectsNames = ["Project_1", "Project_2", "Project_3", "Chicken", "Snorlax", "Pikachu", "Bulbasaur", "Charmander", "Squirtle", "Chest", "Picnic"];
const objectStates = new Map();
let gameStarted = false;
let isLoadingComplete = false;

const modalContent = {
    Project_1: {
        title: "FabricOS",
        description: "A 3js based website to customize a 3d model of a shirt in real time.",
        image: "/Project1-billboard.png",
        links: [
            { text: "View Live Demo", url: "https://customizer-three.vercel.app" },
            { text: "GitHub Code", url: "https://github.com/irfy2k/Customizer.git" }
        ]
    },
    Project_2: {
        title: "Celestia",
        description: "A fullstack website about space and celestial bodies that allows users to explore planets, stars, and galaxies. Frontend Built with basic css, js, and html cuz I am masochist",
        image: "/Project2-billboard.png",
        links: [
            { text: "GitHub Code", url: "https://github.com/nanfaweb/CELESTIA.git" }
        ]
    },
    Project_3: {
        title: "A bootleg portfolio Website",
        description: "Something I cooked up in an hour when I was bored",
        image: "/Project3-billboard.png",
        links: [
            { text: "View Live Demo", url: "https://example.com/weather-app" }
        ]
    },
    Chest: {
        title: "About Me",
        description: "Full-stack developer with 2 years experience building web applications with React, Three.js, and Node.js. I create fast, accessible digital experiences.\n\nTechnical skills:\n\nFrontend: React, JavaScript, HTML/CSS, Three.js, Tailwind\nBackend: Node.js\nLanguages: C++, C, Python, Assembly",
        image: null,
        links: []
    },
    Picnic: {
        title: "Let's Connect!",
        description: "Ready to start a conversation? Whether you have a project in mind, want to collaborate, or just want to chat about web development and 3D art, I'd love to hear from you!",
        image: null,
        isContact: true
    }
};

function showModal(objectName) {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    
    const content = modalContent[objectName];
    if (!content) return;
    
    let modalHTML = `<h2 class="modal-title">${content.title}</h2>`;
    
    if (content.image) {
        modalHTML += `<img src="${content.image}" alt="${content.title}" class="modal-image">`;
    }
    
    modalHTML += `<p class="modal-description">${content.description}</p>`;
    
    if (content.isContact) {
        modalHTML += `
            <div class="contact-form">
                <h3 class="form-title">Get in Touch</h3>
                <form id="contact-form">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required placeholder="Your name">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="your.email@example.com">
                    </div>
                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea id="message" name="message" required placeholder="Tell me about your project or just say hello!"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Send Message</button>
                </form>
            </div>`;
    } else if (content.links) {
        modalHTML += '<div class="modal-links">';
        content.links.forEach(link => {
            modalHTML += `<a href="${link.url}" class="modal-link" target="_blank">${link.text}</a>`;
        });
        modalHTML += '</div>';
    }
    
    modalBody.innerHTML = modalHTML;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    if (content.isContact) {
        const form = document.getElementById('contact-form');
        form.addEventListener('submit', handleContactForm);
    }
}

function hideModal() {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    
    if (!isMuted) {
        playSound("projectsSFX");
    }
}

function handleContactForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    const emailData = {
        to: 'irfy2k1@outlook.com',
        subject: `Portfolio Contact from ${name}`,
        body: `
New message from your portfolio website:

Name: ${name}
Email: ${email}

Message:
${message}

---
Sent from Portfolio Contact Form
        `.trim()
    };
    
    // Method 1: Try FormSubmit
    fetch('https://formsubmit.co/7cdd4393cea5cba574e4368fa9084619', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            _subject: `Portfolio Contact from ${name}`,
            _captcha: 'false',
            _template: 'table'
        })
    })
    .then(response => {
        if (response.ok) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert('Thank you for your message! I\'ll get back to you soon.');
            hideModal();
        } else {
            throw new Error('FormSubmit failed');
        }
    })
    .catch(error => {
        console.log('FormSubmit failed, trying mailto fallback:', error);
        
        // Method 2: Fallback to mailto
        const subject = encodeURIComponent(emailData.subject);
        const body = encodeURIComponent(emailData.body);
        const mailtoLink = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        window.open(mailtoLink, '_blank');
        
        alert('Email client opened! Please send the email to complete your message.');
        hideModal();
    });
}

let loadedModel = null;
const loader = new GLTFLoader();
loader.load('/Portfolio-map-Snorlax1.glb', function (gltf) {
    loadedModel = gltf.scene;
    scene.add(loadedModel);

    loadedModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }

        if (intersectObjectsNames.includes(child.name)) {
            intersectObjects.push(child);
            objectStates.set(child.name, {
                position: { ...child.position },
                rotation: { ...child.rotation },
                scale: { ...child.scale }
            });
        }
        
        // --- SETUP PLAYER PHYSICS ---
        if (child.name === "Character") {
            character.instance = child;
            character.spawnPosition.copy(child.position);
            playerCollider.start.copy(child.position).add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
            playerCollider.end.copy(child.position).add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
            console.log('Player character found and physics capsule initialized!');
        }
        
        // --- SETUP WORLD COLLISION ---
        if (child.name === "Ground_Collider") {
            colliderOctree.fromGraphNode(child);
            child.visible = false;
            console.log('Ground collider found and Octree built!');
        }
    });
    
    // Add glowing outlines to interactable objects
    setTimeout(() => {
        addGlowingOutlines();
        console.log('Glowing outlines added to interactable objects!');
    }, 500);
    
    startLoadingProgress();
}, undefined, function (error) {
    console.error('An error occurred while loading the model:', error);
});

function startLoadingProgress() {
    const loadingBar = document.querySelector('.loading-bar');
    const progressText = document.querySelector('.loading-progress-text');
    const playButton = document.getElementById('play-button');
    let progress = 0;
    
    const progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2; 
        if (progress > 100) progress = 100;
        
        if (loadingBar) loadingBar.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.floor(progress) + '%';
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            isLoadingComplete = true;
            if (playButton) {
                playButton.disabled = false;
                const spinner = playButton.querySelector('.loading-spinner');
                const buttonText = playButton.querySelector('.button-text');
                
                if (spinner) {
                    spinner.className = 'fas fa-play';
                    spinner.style.marginRight = '10px';
                }
                if (buttonText) buttonText.textContent = 'Enter Park!';
                
                playButton.style.animation = 'loadingPulse 1s ease-in-out infinite alternate';
            }
        }
    }, 50);
}

function respawnCharacter() {
    if (!character.instance) return;
    character.instance.position.copy(character.spawnPosition);
    playerCollider.start.copy(character.spawnPosition).add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
    playerCollider.end.copy(character.spawnPosition).add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
    playerVelocity.set(0, 0, 0);
}

function playerCollisions() {
    const result = colliderOctree.capsuleIntersect(playerCollider);
    playerOnFloor = false;
    if (result) {
        playerOnFloor = result.normal.y > 0;
        if (!playerOnFloor) {
            playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
        }
        playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
}

function updatePlayer(deltaTime) {
    if (!character.instance || !gameStarted) return;
    
    if (character.instance.position.y < -20) {
        respawnCharacter();
    }
    
    let damping = Math.exp(-4 * deltaTime) - 1;
    if (!playerOnFloor) {
        playerVelocity.y -= GRAVITY * deltaTime;
        damping *= 0.1; // less air control
    }
    playerVelocity.addScaledVector(playerVelocity, damping);

    const moveVector = new THREE.Vector3();
    if (pressedButtons.up) moveVector.z = 1;  // W key now moves left
    if (pressedButtons.down) moveVector.z = -1;  // S key now moves right
    if (pressedButtons.left) moveVector.x = 1; // A key now moves backward
    if (pressedButtons.right) moveVector.x = -1; // D key now moves forward
    moveVector.normalize();

    if (moveVector.length() > 0) {
        character.isMoving = true;
        
        // Continuous hopping while moving and on floor
        const currentTime = Date.now();
        if (playerOnFloor && (currentTime - character.lastHopTime) > character.hopCooldown) {
            playerVelocity.y = JUMP_HEIGHT * 0.8;
            character.lastHopTime = currentTime;
            if (!isMuted) playSound("jumpSFX");
        }
        
        // Fixed rotation based on isometric view
        if (pressedButtons.up && !pressedButtons.left && !pressedButtons.right) targetRotation = -Math.PI / 2;     
        else if (pressedButtons.down && !pressedButtons.left && !pressedButtons.right) targetRotation = Math.PI / 2; 
        else if (pressedButtons.left && !pressedButtons.up && !pressedButtons.down) targetRotation = 0;        
        else if (pressedButtons.right && !pressedButtons.up && !pressedButtons.down) targetRotation = Math.PI;             
        else if (pressedButtons.up && pressedButtons.right) targetRotation = -Math.PI * 0.75;     
        else if (pressedButtons.up && pressedButtons.left) targetRotation = -Math.PI / 4;   
        else if (pressedButtons.down && pressedButtons.right) targetRotation = Math.PI * 0.75;  
        else if (pressedButtons.down && pressedButtons.left) targetRotation = Math.PI / 4; 
    } else {
        character.isMoving = false;
    }
    
    const deltaVector = moveVector.multiplyScalar(MOVE_SPEED * deltaTime);
    playerCollider.translate(deltaVector);
    playerCollisions();
    
    playerCollider.translate(new THREE.Vector3(0, playerVelocity.y, 0).multiplyScalar(deltaTime));
    playerCollisions();

    character.instance.position.copy(playerCollider.start).y -= CAPSULE_RADIUS;
    
    const rotationDiff = ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    character.instance.rotation.y += rotationDiff * 0.2;
}

function updateCameraToFollowPlayer() {
    if (!character.instance || !gameStarted) return;
    
    const targetPosition = new THREE.Vector3().copy(character.instance.position);
    const cameraOffset = new THREE.Vector3(-35, 50, -60);
    const newCameraPosition = new THREE.Vector3().addVectors(targetPosition, cameraOffset);
    camera.position.lerp(newCameraPosition, 0.1);
    controls.target.lerp(targetPosition, 0.1);
}

function onKeyDown(event) {
    if (isMobile) return;
    if (event.code.toLowerCase() === "keyr") respawnCharacter();
    
    switch (event.code.toLowerCase()) {
        case "keyw": case "arrowup": pressedButtons.up = true; break;
        case "keys": case "arrowdown": pressedButtons.down = true; break;
        case "keya": case "arrowleft": pressedButtons.left = true; break;
        case "keyd": case "arrowright": pressedButtons.right = true; break;
    }
}

function onKeyUp(event) {
    if (isMobile) return;
    
    switch (event.code.toLowerCase()) {
        case "keyw": case "arrowup": pressedButtons.up = false; break;
        case "keys": case "arrowdown": pressedButtons.down = false; break;
        case "keya": case "arrowleft": pressedButtons.left = false; break;
        case "keyd": case "arrowright": pressedButtons.right = false; break;
    }
}

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    
    camera.left = -aspect * 50;
    camera.right = aspect * 50;
    camera.top = 50;
    camera.bottom = -50;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    controls.update();
}

function handlePointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function handleClick(event) {
    if (!gameStarted) return;
    
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(intersectObjects, true);
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const objectName = clickedObject.parent ? clickedObject.parent.name : clickedObject.name;
        
        if (intersectObjectsNames.includes(objectName)) {
            const hopObjects = ["Chicken", "Snorlax", "Pikachu", "Bulbasaur", "Charmander", "Squirtle"];
            
            // Remove glow from clicked object
            removeGlowingOutline(objectName);
            
            if (hopObjects.includes(objectName)) {
                if (!isMuted) playSound("pokemonSFX");
                hopAnimation(objectName);
            } else if (objectName.startsWith("Project_") || objectName === "Chest" || objectName === "Picnic") {
                if (!isMuted) playSound("projectsSFX");
                showModal(objectName);
            }
        }
    }
}

function hopAnimation(objectName) {
    let targetObject = null;
    loadedModel.traverse((child) => {
        if (child.name === objectName) {
            targetObject = child;
        }
    });
    
    if (!targetObject) return;
    
    const currentState = objectStates.get(objectName);
    const movementRadius = 4;
    
    let velocity = {
        x: (Math.random() - 0.5) * 8,
        y: 15,
        z: (Math.random() - 0.5) * 8
    };
    
    const gravity = -25;
    const damping = 0.7;
    const groundLevel = currentState.position.y;
    const boundaries = {
        x: { min: currentState.position.x - movementRadius, max: currentState.position.x + movementRadius },
        z: { min: currentState.position.z - movementRadius, max: currentState.position.z + movementRadius }
    };
    
    let currentPosition = { x: targetObject.position.x, y: targetObject.position.y, z: targetObject.position.z };
    let currentVelocity = { ...velocity };
    let startTime = null;
    let bounceCount = 0;
    
    function animateBounce(timestamp) {
        if (!startTime) startTime = timestamp;
        
        const totalVelocity = Math.sqrt(
            currentVelocity.x ** 2 + currentVelocity.y ** 2 + currentVelocity.z ** 2
        );
        
        // Stop animation when object has settled
        const isSettled = totalVelocity < 1.0 && 
                          currentPosition.y <= groundLevel + 0.2 && 
                          Math.abs(currentVelocity.y) < 0.5;
        
        if (isSettled) {
            targetObject.position.y = groundLevel;
            targetObject.scale.set(1, 1, 1);
            
            objectStates.set(objectName, {
                position: { ...targetObject.position },
                rotation: { ...targetObject.rotation },
                scale: { ...targetObject.scale }
            });
            return;
        }
        
        const deltaTime = 0.016; // ~60fps
        
        currentVelocity.y += gravity * deltaTime;
        currentPosition.x += currentVelocity.x * deltaTime;
        currentPosition.y += currentVelocity.y * deltaTime;
        currentPosition.z += currentVelocity.z * deltaTime;
        
        // Ground collision
        if (currentPosition.y <= groundLevel && currentVelocity.y < 0) {
            currentPosition.y = groundLevel;
            currentVelocity.y = -currentVelocity.y * damping;
            currentVelocity.x *= damping;
            currentVelocity.z *= damping;
            bounceCount++;
            
            // Add impact rotation for ragdoll effect
            targetObject.rotation.x += (Math.random() - 0.5) * 0.5;
            targetObject.rotation.z += (Math.random() - 0.5) * 0.5;
            
            const randomFactor = Math.max(0.1, 1 - (bounceCount * 0.2));
            currentVelocity.x += (Math.random() - 0.5) * 2 * randomFactor;
            currentVelocity.z += (Math.random() - 0.5) * 2 * randomFactor;
        }
        
        // Boundary collisions
        if (currentPosition.x <= boundaries.x.min || currentPosition.x >= boundaries.x.max) {
            currentVelocity.x = -currentVelocity.x * 0.8;
            currentPosition.x = Math.max(boundaries.x.min, Math.min(boundaries.x.max, currentPosition.x));
        }
        if (currentPosition.z <= boundaries.z.min || currentPosition.z >= boundaries.z.max) {
            currentVelocity.z = -currentVelocity.z * 0.8;
            currentPosition.z = Math.max(boundaries.z.min, Math.min(boundaries.z.max, currentPosition.z));
        }
        
        targetObject.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
        
        // Squash and stretch
        const velocityMagnitude = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2 + currentVelocity.z ** 2);
        const squashFactor = Math.max(0.6, 1 - (velocityMagnitude / 20) * 0.4);
        const stretchFactor = Math.min(1.4, 1 + (Math.abs(currentVelocity.y) / 15) * 0.4);
        
        if (currentPosition.y <= groundLevel + 0.1) {
            targetObject.scale.set(1.3, 0.7, 1.3);
        } else {
            targetObject.scale.set(squashFactor, stretchFactor, squashFactor);
        }
        
        // Rotation based on movement direction
        targetObject.rotation.x += currentVelocity.z * deltaTime * 1.0;
        targetObject.rotation.z += currentVelocity.x * deltaTime * 1.0;
        targetObject.rotation.y += (currentVelocity.x + currentVelocity.z) * deltaTime * 0.5;
        
        requestAnimationFrame(animateBounce);
    }
    
    requestAnimationFrame(animateBounce);
}

// Add glowing outlines to interactable objects
function addGlowingOutlines() {
    intersectObjects.forEach(obj => {
        if (intersectObjectsNames.includes(obj.name)) {
            console.log('Adding glow to:', obj.name);
            
            // Mark object as having glow
            obj.userData.hasGlow = true;
            
            // Traverse the object and its children to add glow
            obj.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Store original material if not already stored
                    if (!child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material.clone();
                    }
                    
                    // Create a glowing material
                    const glowMaterial = child.material.clone();
                    glowMaterial.emissive = new THREE.Color(0x00ffff); // Cyan glow
                    glowMaterial.emissiveIntensity = 0.3;
                    
                    // Add a subtle pulsing effect
                    child.userData.glowMaterial = glowMaterial;
                    child.material = glowMaterial;
                    
                    console.log('Added glow to mesh:', child.name);
                }
            });
        }
    });
}

// Remove glowing outline from an object
function removeGlowingOutline(objectName) {
    const targetObject = intersectObjects.find(obj => obj.name === objectName);
    if (targetObject && targetObject.userData.hasGlow) {
        console.log('Removing glow from:', objectName);
        
        // Mark object as no longer having glow
        targetObject.userData.hasGlow = false;
        
        // Traverse the object and restore original materials
        targetObject.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
                console.log('Restored original material for mesh:', child.name);
            }
        });
    }
}

// Update glow animation
function updateGlowAnimation() {
    const time = clock.getElapsedTime();
    
    intersectObjects.forEach(obj => {
        if (intersectObjectsNames.includes(obj.name) && obj.userData.hasGlow) {
            obj.traverse((child) => {
                if (child.isMesh && child.userData.glowMaterial) {
                    // Pulsing glow effect
                    const pulse = 0.2 + Math.sin(time * 2) * 0.1;
                    child.userData.glowMaterial.emissiveIntensity = pulse;
                }
            });
        }
    });
}

window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('click', handleClick);
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

// Prevent zoom on mobile
document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

document.addEventListener('DOMContentLoaded', () => {
    initMobileSupport();
    
    const loadingSubtitle = document.querySelector('.loading-subtitle');
    if (loadingSubtitle) {
        loadingSubtitle.textContent = isMobile ? 'use touch controls to move' : 'use arrow keys to move';
    }
    
    const playButton = document.getElementById('play-button');
    const loadingScreen = document.getElementById('loading');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (playButton) {
        playButton.addEventListener('click', () => {
            if (isLoadingComplete) {
                // Initialize audio on first user interaction
                initializeAudio();
                
                gameStarted = true;
                console.log('Game started! Glowing outlines should be visible.');
                
                if (loadingScreen) loadingScreen.style.display = 'none';
                if (isMobile) createMobileControls();
                
                if (!isMuted) {
                    playSound("projectsSFX");
                    playSound("backgroundMusic");
                }
                console.log('Game started!');
            }
        });
    }
    
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideModal);
    if (modalOverlay) modalOverlay.addEventListener('click', hideModal);
    if (musicToggleButton) musicToggleButton.addEventListener('click', toggleMusic);
    if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);
});

let isMobile = false;
const touchControls = { up: false, down: false, left: false, right: false };

function detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileDevice || (isTouchDevice && isSmallScreen);
}

function initMobileSupport() {
    isMobile = detectMobile();
    if (isMobile) {
        camera.zoom = 1.5;
        camera.updateProjectionMatrix();
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        console.log('Mobile support enabled');
    }
}

function createMobileControls() {
    if (document.getElementById('mobile-controls')) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.innerHTML = `
        <div class="mobile-controls-container">
            <div class="dpad-container">
                <button class="dpad-btn dpad-up" data-direction="up"><i class="fas fa-chevron-up"></i></button>
                <div class="dpad-middle">
                    <button class="dpad-btn dpad-left" data-direction="left"><i class="fas fa-chevron-left"></i></button>
                    <button class="dpad-btn dpad-right" data-direction="right"><i class="fas fa-chevron-right"></i></button>
                </div>
                <button class="dpad-btn dpad-down" data-direction="down"><i class="fas fa-chevron-down"></i></button>
            </div>
        </div>`;
    document.body.appendChild(controlsContainer);
    
    const mobileStyles = document.createElement('style');
    mobileStyles.textContent = `
        #mobile-controls { position: fixed; bottom: 20px; left: 20px; z-index: 1000; display: block; }
        .mobile-controls-container { background: rgba(139, 101, 89, 0.9); border-radius: 15px; padding: 15px; backdrop-filter: blur(10px); border: 2px solid rgba(205, 164, 147, 0.3); }
        .dpad-container { display: grid; grid-template-rows: 50px 50px 50px; grid-template-columns: 50px 50px 50px; gap: 5px; width: 160px; height: 160px; }
        .dpad-up { grid-column: 2; grid-row: 1; }
        .dpad-middle { grid-column: 1 / 4; grid-row: 2; display: flex; justify-content: space-between; align-items: center; }
        .dpad-left, .dpad-right { width: 50px; height: 50px; }
        .dpad-down { grid-column: 2; grid-row: 3; }
        .dpad-btn { width: 50px; height: 50px; border: 2px solid rgba(205, 164, 147, 0.5); background: rgba(227, 201, 187, 0.8); border-radius: 8px; color: #654321; font-size: 18px; cursor: pointer; transition: all 0.1s ease; display: flex; align-items: center; justify-content: center; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
        .dpad-btn:active { background: rgba(205, 164, 147, 0.9); transform: scale(0.95); border-color: rgba(139, 101, 89, 0.8); }
        .dpad-btn i { pointer-events: none; }
        @media (max-width: 768px) {
            #mobile-controls { display: block; }
            .controls { top: 10px; right: 10px; gap: 8px; }
            .control-btn { width: 40px; height: 40px; font-size: 16px; }
            .modal { margin: 10px; max-width: calc(100vw - 20px); max-height: calc(100vh - 20px); }
            .modal-image { max-width: 100%; height: auto; }
        }`;
    document.head.appendChild(mobileStyles);
    setupMobileTouchEvents();
}

function setupMobileTouchEvents() {
    document.querySelectorAll('.dpad-btn').forEach(button => {
        const direction = button.getAttribute('data-direction');
        
        const setTouch = (state) => (e) => {
            e.preventDefault();
            touchControls[direction] = state;
            updateMovementFromTouch();
        };
        
        button.addEventListener('touchstart', setTouch(true), { passive: false });
        button.addEventListener('touchend', setTouch(false), { passive: false });
        button.addEventListener('touchcancel', setTouch(false), { passive: false });
        button.addEventListener('mousedown', setTouch(true));
        button.addEventListener('mouseup', setTouch(false));
        button.addEventListener('mouseleave', setTouch(false));
    });
}

function updateMovementFromTouch() {
    if (isMobile) {
        pressedButtons.up = touchControls.up;
        pressedButtons.down = touchControls.down;
        pressedButtons.left = touchControls.left;
        pressedButtons.right = touchControls.right;
    }
}

function handleOrientationChange() {
    // Add a small delay to allow the browser to update dimensions
    setTimeout(() => {
        handleResize();
        if (isMobile) {
            const isLandscape = window.innerWidth > window.innerHeight;
            camera.zoom = isLandscape ? 1.8 : 1.5;
            camera.updateProjectionMatrix();
        }
    }, 100);
}

function animate() {
    const deltaTime = Math.min(0.05, clock.getDelta());
    
    updatePlayer(deltaTime);
    updateCameraToFollowPlayer();
    controls.update();
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(intersectObjects, true);
    
    document.body.style.cursor = 'default';
    if (intersects.length > 0) {
        const hoveredName = intersects[0].object.parent ? intersects[0].object.parent.name : intersects[0].object.name;
        if(intersectObjectsNames.includes(hoveredName)) {
            document.body.style.cursor = 'pointer';
        }
    }

    updateGlowAnimation();

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);