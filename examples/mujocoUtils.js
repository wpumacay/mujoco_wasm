import * as THREE from 'three';
import { Reflector  } from './utils/Reflector.js';
import { MuJoCoDemo } from './main.js';

export async function reloadFunc() {
  // Delete the old scene and load the new scene
  this.scene.remove(this.scene.getObjectByName("MuJoCo Root"));
  [this.model, this.state, this.simulation, this.bodies, this.lights] =
    await loadSceneFromURL(this.mujoco, this.params.scene, this);
  this.simulation.forward();
  for (let i = 0; i < this.updateGUICallbacks.length; i++) {
    this.updateGUICallbacks[i](this.model, this.simulation, this.params);
  }
}

/** @param {MuJoCoDemo} parentContext*/
export function setupGUI(parentContext) {

  // Make sure we reset the camera when the scene is changed or reloaded.
  parentContext.updateGUICallbacks.length = 0;
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    // TODO: Use free camera parameters from MuJoCo
    parentContext.camera.position.set(2.0, 1.7, 1.7);
    parentContext.controls.target.set(0, 0.7, 0);
    parentContext.controls.update(); });

  // Add scene selection dropdown.
  let reload = reloadFunc.bind(parentContext);
  parentContext.gui.add(parentContext.params, 'scene', {
    "Humanoid": "humanoid.xml",
    "Cassie": "agility_cassie/scene.xml",
    "Hammock": "hammock.xml",
    "Balloons": "balloons.xml",
    "Hand": "shadow_hand/scene_right.xml",
    "Flag": "flag.xml",
    "Mug": "mug.xml",
    "Tendon": "model_with_tendon.xml",
    "Kitchen": "kitchen.xml",
    "Kitchen - v0": "kitchen/kitchen_v0.xml",
    "Bimanual - v0": "test.xml"
  }).name('Example Scene').onChange(reload);

  // Add a help menu.
  // Parameters:
  //  Name: "Help".
  //  When pressed, a help menu is displayed in the top left corner. When pressed again
  //  the help menu is removed.
  //  Can also be triggered by pressing F1.
  // Has a dark transparent background.
  // Has two columns: one for putting the action description, and one for the action key trigger.keyframeNumber
  let keyInnerHTML = '';
  let actionInnerHTML = '';
  const displayHelpMenu = () => {
    if (parentContext.params.help) {
      const helpMenu = document.createElement('div');
      helpMenu.style.position = 'absolute';
      helpMenu.style.top = '10px';
      helpMenu.style.left = '10px';
      helpMenu.style.color = 'white';
      helpMenu.style.font = 'normal 18px Arial';
      helpMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      helpMenu.style.padding = '10px';
      helpMenu.style.borderRadius = '10px';
      helpMenu.style.display = 'flex';
      helpMenu.style.flexDirection = 'column';
      helpMenu.style.alignItems = 'center';
      helpMenu.style.justifyContent = 'center';
      helpMenu.style.width = '400px';
      helpMenu.style.height = '400px';
      helpMenu.style.overflow = 'auto';
      helpMenu.style.zIndex = '1000';

      const helpMenuTitle = document.createElement('div');
      helpMenuTitle.style.font = 'bold 24px Arial';
      helpMenuTitle.innerHTML = '';
      helpMenu.appendChild(helpMenuTitle);

      const helpMenuTable = document.createElement('table');
      helpMenuTable.style.width = '100%';
      helpMenuTable.style.marginTop = '10px';
      helpMenu.appendChild(helpMenuTable);

      const helpMenuTableBody = document.createElement('tbody');
      helpMenuTable.appendChild(helpMenuTableBody);

      const helpMenuRow = document.createElement('tr');
      helpMenuTableBody.appendChild(helpMenuRow);

      const helpMenuActionColumn = document.createElement('td');
      helpMenuActionColumn.style.width = '50%';
      helpMenuActionColumn.style.textAlign = 'right';
      helpMenuActionColumn.style.paddingRight = '10px';
      helpMenuRow.appendChild(helpMenuActionColumn);

      const helpMenuKeyColumn = document.createElement('td');
      helpMenuKeyColumn.style.width = '50%';
      helpMenuKeyColumn.style.textAlign = 'left';
      helpMenuKeyColumn.style.paddingLeft = '10px';
      helpMenuRow.appendChild(helpMenuKeyColumn);

      const helpMenuActionText = document.createElement('div');
      helpMenuActionText.innerHTML = actionInnerHTML;
      helpMenuActionColumn.appendChild(helpMenuActionText);

      const helpMenuKeyText = document.createElement('div');
      helpMenuKeyText.innerHTML = keyInnerHTML;
      helpMenuKeyColumn.appendChild(helpMenuKeyText);

      // Close buttom in the top.
      const helpMenuCloseButton = document.createElement('button');
      helpMenuCloseButton.innerHTML = 'Close';
      helpMenuCloseButton.style.position = 'absolute';
      helpMenuCloseButton.style.top = '10px';
      helpMenuCloseButton.style.right = '10px';
      helpMenuCloseButton.style.zIndex = '1001';
      helpMenuCloseButton.onclick = () => {
        helpMenu.remove();
      };
      helpMenu.appendChild(helpMenuCloseButton);

      document.body.appendChild(helpMenu);
    } else {
      document.body.removeChild(document.body.lastChild);
    }
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
      parentContext.params.help = !parentContext.params.help;
      displayHelpMenu();
      event.preventDefault();
    }
  });
  keyInnerHTML += 'F1<br>';
  actionInnerHTML += 'Help<br>';

  let simulationFolder = parentContext.gui.addFolder("Simulation");

  // Add pause simulation checkbox.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Pause Simulation".
  //  When paused, a "pause" text in white is displayed in the top left corner.
  //  Can also be triggered by pressing the spacebar.
  const pauseSimulation = simulationFolder.add(parentContext.params, 'paused').name('Pause Simulation');
  pauseSimulation.onChange((value) => {
    if (value) {
      const pausedText = document.createElement('div');
      pausedText.style.position = 'absolute';
      pausedText.style.top = '10px';
      pausedText.style.left = '10px';
      pausedText.style.color = 'white';
      pausedText.style.font = 'normal 18px Arial';
      pausedText.innerHTML = 'pause';
      parentContext.container.appendChild(pausedText);
    } else {
      parentContext.container.removeChild(parentContext.container.lastChild);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      parentContext.params.paused = !parentContext.params.paused;
      pauseSimulation.setValue(parentContext.params.paused);
      event.preventDefault();
    }
  });
  actionInnerHTML += 'Play / Pause<br>';
  keyInnerHTML += 'Space<br>';

  // Add reload model button.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Reload".
  //  When pressed, calls the reload function.
  //  Can also be triggered by pressing ctrl + L.
  simulationFolder.add({reload: () => { reload(); }}, 'reload').name('Reload');
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.code === 'KeyL') { reload();  event.preventDefault(); }});
  actionInnerHTML += 'Reload XML<br>';
  keyInnerHTML += 'Ctrl L<br>';

  // Add reset simulation button.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Reset".
  //  When pressed, resets the simulation to the initial state.
  //  Can also be triggered by pressing backspace.
  const resetSimulation = () => {
    parentContext.simulation.resetData();
    parentContext.simulation.forward();
  };
  simulationFolder.add({reset: () => { resetSimulation(); }}, 'reset').name('Reset');
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Backspace') { resetSimulation(); event.preventDefault(); }});
  actionInnerHTML += 'Reset simulation<br>';
  keyInnerHTML += 'Backspace<br>';

  // Add keyframe slider.
  let nkeys = parentContext.model.nkey;
  let keyframeGUI = simulationFolder.add(parentContext.params, "keyframeNumber", 0, nkeys - 1, 1).name('Load Keyframe').listen();
  keyframeGUI.onChange((value) => {
    if (value < parentContext.model.nkey) {
      parentContext.simulation.qpos.set(parentContext.model.key_qpos.slice(
        value * parentContext.model.nq, (value + 1) * parentContext.model.nq)); }});
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    let nkeys = parentContext.model.nkey;
    console.log("new model loaded. has " + nkeys + " keyframes.");
    if (nkeys > 0) {
      keyframeGUI.max(nkeys - 1);
      keyframeGUI.domElement.style.opacity = 1.0;
    } else {
      // Disable keyframe slider if no keyframes are available.
      keyframeGUI.max(0);
      keyframeGUI.domElement.style.opacity = 0.5;
    }
  });

  // Add sliders for ctrlnoiserate and ctrlnoisestd; min = 0, max = 2, step = 0.01.
  simulationFolder.add(parentContext.params, 'ctrlnoiserate', 0.0, 2.0, 0.01).name('Noise rate' );
  simulationFolder.add(parentContext.params, 'ctrlnoisestd' , 0.0, 2.0, 0.01).name('Noise scale');

  let textDecoder = new TextDecoder("utf-8");
  let nullChar    = textDecoder.decode(new ArrayBuffer(1));

  // Add actuator sliders.
  let actuatorFolder = simulationFolder.addFolder("Actuators");
  const addActuators = (model, simulation, params) => {
    let act_range = model.actuator_ctrlrange;
    let actuatorGUIs = [];
    for (let i = 0; i < model.nu; i++) {
      if (!model.actuator_ctrllimited[i]) { continue; }
      let name = textDecoder.decode(
        parentContext.model.names.subarray(
          parentContext.model.name_actuatoradr[i])).split(nullChar)[0];

      parentContext.params[name] = 0.0;
      let actuatorGUI = actuatorFolder.add(parentContext.params, name, act_range[2 * i], act_range[2 * i + 1], 0.01).name(name).listen();
      actuatorGUIs.push(actuatorGUI);
      actuatorGUI.onChange((value) => {
        simulation.ctrl[i] = value;
      });
    }
    return actuatorGUIs;
  };
  let actuatorGUIs = addActuators(parentContext.model, parentContext.simulation, parentContext.params);
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    for (let i = 0; i < actuatorGUIs.length; i++) {
      actuatorGUIs[i].destroy();
    }
    actuatorGUIs = addActuators(model, simulation, parentContext.params);
  });
  actuatorFolder.close();

  // Add function that resets the camera to the default position.
  // Can be triggered by pressing ctrl + A.
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.code === 'KeyA') {
      // TODO: Use free camera parameters from MuJoCo
      parentContext.camera.position.set(2.0, 1.7, 1.7);
      parentContext.controls.target.set(0, 0.7, 0);
      parentContext.controls.update(); 
      event.preventDefault();
    }
  });
  actionInnerHTML += 'Reset free camera<br>';
  keyInnerHTML += 'Ctrl A<br>';

  parentContext.gui.open();
}


/** Loads a scene for MuJoCo
 * @param {mujoco} mujoco This is a reference to the mujoco namespace object
 * @param {string} filename This is the name of the .xml file in the /working/ directory of the MuJoCo/Emscripten Virtual File System
 * @param {MuJoCoDemo} parent The three.js Scene Object to add the MuJoCo model elements to
 */
export async function loadSceneFromURL(mujoco, filename, parent) {
    // Free the old simulation.
    if (parent.simulation != null) {
      parent.simulation.free();
      parent.model      = null;
      parent.state      = null;
      parent.simulation = null;
    }

    // Load in the state from XML.
    parent.model       = mujoco.Model.load_from_xml("/working/"+filename);
    parent.state       = new mujoco.State(parent.model);
    parent.simulation  = new mujoco.Simulation(parent.model, parent.state);

    let model = parent.model;
    let state = parent.state;
    let simulation = parent.simulation;

    // Decode the null-terminated string names.
    let textDecoder = new TextDecoder("utf-8");
    let fullString = textDecoder.decode(model.names);
    let names = fullString.split(textDecoder.decode(new ArrayBuffer(1)));

    // Create the root object.
    let mujocoRoot = new THREE.Group();
    mujocoRoot.name = "MuJoCo Root"
    parent.scene.add(mujocoRoot);

    /** @type {Object.<number, THREE.Group>} */
    let bodies = {};
    /** @type {Object.<number, THREE.BufferGeometry>} */
    let meshes = {};
    /** @type {THREE.Light[]} */
    let lights = [];

    // Default material definition.
    let material = new THREE.MeshPhysicalMaterial();
    material.color = new THREE.Color(1, 1, 1);

    // Loop through the MuJoCo geoms and recreate them in three.js.
    for (let g = 0; g < model.ngeom; g++) {
      // Only visualize geom groups up to 2 (same default behavior as simulate).
      if (!(model.geom_group[g] < 3)) { continue; }

      // Get the body ID and type of the geom.
      let b = model.geom_bodyid[g];
      let type = model.geom_type[g];
      let size = [
        model.geom_size[(g*3) + 0],
        model.geom_size[(g*3) + 1],
        model.geom_size[(g*3) + 2]
      ];

      // Create the body if it doesn't exist.
      if (!(b in bodies)) {
        bodies[b] = new THREE.Group();
        bodies[b].name = names[model.name_bodyadr[b]];
        bodies[b].bodyID = b;
        bodies[b].has_custom_mesh = false;
      }

      // Set the default geometry. In MuJoCo, this is a sphere.
      let geometry = new THREE.SphereGeometry(size[0] * 0.5);
      if (type == mujoco.mjtGeom.mjGEOM_PLANE.value) {
        // Special handling for plane later.
      } else if (type == mujoco.mjtGeom.mjGEOM_HFIELD.value) {
        // TODO: Implement this.
      } else if (type == mujoco.mjtGeom.mjGEOM_SPHERE.value) {
        geometry = new THREE.SphereGeometry(size[0]);
      } else if (type == mujoco.mjtGeom.mjGEOM_CAPSULE.value) {
        geometry = new THREE.CapsuleGeometry(size[0], size[1] * 2.0, 20, 20);
      } else if (type == mujoco.mjtGeom.mjGEOM_ELLIPSOID.value) {
        geometry = new THREE.SphereGeometry(1); // Stretch this below
      } else if (type == mujoco.mjtGeom.mjGEOM_CYLINDER.value) {
        geometry = new THREE.CylinderGeometry(size[0], size[0], size[1] * 2.0);
      } else if (type == mujoco.mjtGeom.mjGEOM_BOX.value) {
        geometry = new THREE.BoxGeometry(size[0] * 2.0, size[2] * 2.0, size[1] * 2.0);
      } else if (type == mujoco.mjtGeom.mjGEOM_MESH.value) {
        let meshID = model.geom_dataid[g];

        if (!(meshID in meshes)) {
          geometry = new THREE.BufferGeometry(); // TODO: Populate the Buffer Geometry with Generic Mesh Data

          let vertex_buffer = model.mesh_vert.subarray(
             model.mesh_vertadr[meshID] * 3,
            (model.mesh_vertadr[meshID]  + model.mesh_vertnum[meshID]) * 3);
          for (let v = 0; v < vertex_buffer.length; v+=3){
            //vertex_buffer[v + 0] =  vertex_buffer[v + 0];
            let temp             =  vertex_buffer[v + 1];
            vertex_buffer[v + 1] =  vertex_buffer[v + 2];
            vertex_buffer[v + 2] = -temp;
          }

          let normal_buffer = model.mesh_normal.subarray(
             model.mesh_vertadr[meshID] * 3,
            (model.mesh_vertadr[meshID]  + model.mesh_vertnum[meshID]) * 3);
          for (let v = 0; v < normal_buffer.length; v+=3){
            //normal_buffer[v + 0] =  normal_buffer[v + 0];
            let temp             =  normal_buffer[v + 1];
            normal_buffer[v + 1] =  normal_buffer[v + 2];
            normal_buffer[v + 2] = -temp;
          }

          let uv_buffer = model.mesh_texcoord.subarray(
             model.mesh_texcoordadr[meshID] * 2,
            (model.mesh_texcoordadr[meshID]  + model.mesh_vertnum[meshID]) * 2);
          let triangle_buffer = model.mesh_face.subarray(
             model.mesh_faceadr[meshID] * 3,
            (model.mesh_faceadr[meshID]  + model.mesh_facenum[meshID]) * 3);
          geometry.setAttribute("position", new THREE.BufferAttribute(vertex_buffer, 3));
          geometry.setAttribute("normal"  , new THREE.BufferAttribute(normal_buffer, 3));
          geometry.setAttribute("uv"      , new THREE.BufferAttribute(    uv_buffer, 2));
          geometry.setIndex    (Array.from(triangle_buffer));
          meshes[meshID] = geometry;
        } else {
          geometry = meshes[meshID];
        }

        bodies[b].has_custom_mesh = true;
      }
      // Done with geometry creation.

      // Set the Material Properties of incoming bodies
      let texture = undefined;
      let color = [
        model.geom_rgba[(g * 4) + 0],
        model.geom_rgba[(g * 4) + 1],
        model.geom_rgba[(g * 4) + 2],
        model.geom_rgba[(g * 4) + 3]];
      if (model.geom_matid[g] != -1) {
        let matId = model.geom_matid[g];
        color = [
          model.mat_rgba[(matId * 4) + 0],
          model.mat_rgba[(matId * 4) + 1],
          model.mat_rgba[(matId * 4) + 2],
          model.mat_rgba[(matId * 4) + 3]];

        // Construct Texture from model.tex_rgb
        texture = undefined;
        let texId = model.mat_texid[matId];
        if (texId != -1) {
          let width    = model.tex_width [texId];
          let height   = model.tex_height[texId];
          let offset   = model.tex_adr   [texId];
          let rgbArray = model.tex_rgb   ;
          let rgbaArray = new Uint8Array(width * height * 4);
          for (let p = 0; p < width * height; p++){
            rgbaArray[(p * 4) + 0] = rgbArray[offset + ((p * 3) + 0)];
            rgbaArray[(p * 4) + 1] = rgbArray[offset + ((p * 3) + 1)];
            rgbaArray[(p * 4) + 2] = rgbArray[offset + ((p * 3) + 2)];
            rgbaArray[(p * 4) + 3] = 1.0;
          }
          texture = new THREE.DataTexture(rgbaArray, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
          if (texId == 2) {
            texture.repeat = new THREE.Vector2(50, 50);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
          } else {
            texture.repeat = new THREE.Vector2(1, 1);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
          }

          texture.needsUpdate = true;
        }
      }

      if (material.color.r != color[0] ||
          material.color.g != color[1] ||
          material.color.b != color[2] ||
          material.opacity != color[3] ||
          material.map     != texture) {
        material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(color[0], color[1], color[2]),
          transparent: color[3] < 1.0,
          opacity: color[3],
          specularIntensity: model.geom_matid[g] != -1 ?       model.mat_specular   [model.geom_matid[g]] *0.5 : undefined,
          reflectivity     : model.geom_matid[g] != -1 ?       model.mat_reflectance[model.geom_matid[g]] : undefined,
          roughness        : model.geom_matid[g] != -1 ? 1.0 - model.mat_shininess  [model.geom_matid[g]] : undefined,
          metalness        : model.geom_matid[g] != -1 ? 0.1 : undefined,
          map              : texture
        });
      }

      let mesh = new THREE.Mesh();
      if (type == 0) {
        mesh = new Reflector( new THREE.PlaneGeometry( 100, 100 ), { clipBias: 0.003,texture: texture } );
        mesh.rotateX( - Math.PI / 2 );
      } else {
        mesh = new THREE.Mesh(geometry, material);
      }

      mesh.castShadow = g == 0 ? false : true;
      mesh.receiveShadow = type != 7;
      mesh.bodyID = b;
      bodies[b].add(mesh);
      getPosition  (model.geom_pos, g, mesh.position  );
      if (type != 0) { getQuaternion(model.geom_quat, g, mesh.quaternion); }
      if (type == 4) { mesh.scale.set(size[0], size[2], size[1]) } // Stretch the Ellipsoid
    }

    // Parse tendons.
    let tendonMat = new THREE.MeshPhongMaterial();
    tendonMat.color = new THREE.Color(0.8, 0.3, 0.3);
    mujocoRoot.cylinders = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(1, 1, 1),
        tendonMat, 1023);
    mujocoRoot.cylinders.receiveShadow = true;
    mujocoRoot.cylinders.castShadow    = true;
    mujocoRoot.add(mujocoRoot.cylinders);
    mujocoRoot.spheres = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 10, 10),
        tendonMat, 1023);
    mujocoRoot.spheres.receiveShadow = true;
    mujocoRoot.spheres.castShadow    = true;
    mujocoRoot.add(mujocoRoot.spheres);

    // Parse lights.
    for (let l = 0; l < model.nlight; l++) {
      let light = new THREE.SpotLight();
      if (model.light_directional[l]) {
        light = new THREE.DirectionalLight();
      } else {
        light = new THREE.SpotLight();
      }
      light.decay = model.light_attenuation[l] * 100;
      light.penumbra = 0.5;
      light.castShadow = true; // default false

      light.shadow.mapSize.width = 1024; // default
      light.shadow.mapSize.height = 1024; // default
      light.shadow.camera.near = 1; // default
      light.shadow.camera.far = 10; // default
      //bodies[model.light_bodyid()].add(light);
      if (bodies[0]) {
        bodies[0].add(light);
      } else {
        mujocoRoot.add(light);
      }
      lights.push(light);
    }
    if (model.nlight == 0) {
      let light = new THREE.DirectionalLight();
      mujocoRoot.add(light);
    }

    for (let b = 0; b < model.nbody; b++) {
      //let parent_body = model.body_parentid()[b];
      if (b == 0 || !bodies[0]) {
        mujocoRoot.add(bodies[b]);
      } else if(bodies[b]){
        bodies[0].add(bodies[b]);
      } else {
        console.log("Body without Geometry detected; adding to bodies", b, bodies[b]);
        bodies[b] = new THREE.Group(); bodies[b].name = names[b + 1]; bodies[b].bodyID = b; bodies[b].has_custom_mesh = false;
        bodies[0].add(bodies[b]);
      }
    }
  
    parent.mujocoRoot = mujocoRoot;

    return [model, state, simulation, bodies, lights]
}

/** Downloads the scenes/examples folder to MuJoCo's virtual filesystem
 * @param {mujoco} mujoco */
export async function downloadExampleScenesFolder(mujoco) {
  let allFiles = [
    "22_humanoids.xml",
    "adhesion.xml",
    "agility_cassie/assets/achilles-rod.obj",
    "agility_cassie/assets/cassie-texture.png",
    "agility_cassie/assets/foot-crank.obj",
    "agility_cassie/assets/foot.obj",
    "agility_cassie/assets/heel-spring.obj",
    "agility_cassie/assets/hip-pitch.obj",
    "agility_cassie/assets/hip-roll.obj",
    "agility_cassie/assets/hip-yaw.obj",
    "agility_cassie/assets/knee-spring.obj",
    "agility_cassie/assets/knee.obj",
    "agility_cassie/assets/pelvis.obj",
    "agility_cassie/assets/plantar-rod.obj",
    "agility_cassie/assets/shin.obj",
    "agility_cassie/assets/tarsus.obj",
    "agility_cassie/cassie.xml",
    "agility_cassie/scene.xml",
    "arm26.xml",
    "balloons.xml",
    "flag.xml",
    "hammock.xml",
    "humanoid.xml",
    "humanoid_body.xml",
    "mug.obj",
    "mug.png",
    "mug.xml",
    "scene.xml",

    "kitchen.xml",
    "assets/LightWoodCounters.png",
    "assets/kitchen_door.obj",
    "assets/kitchen_door_collision_0.obj",
    "assets/kitchen_door_collision_1.obj",
    "assets/kitchen_door_collision_2.obj",
    "assets/kitchen_floor.obj",
    "assets/kitchen_floor.png",
    "assets/kitchen_wall_1.obj",
    "assets/kitchen_wall_1.png",
    "assets/kitchen_wall_2.obj",
    "assets/kitchen_wall_2_collider0.obj",
    "assets/kitchen_wall_2_collider1.obj",
    "assets/kitchen_wall_2_collider2.obj",
    "assets/kitchen_wall_3.obj",
    "assets/kitchen_wall_3.png",
    "assets/kitchen_wall_4.obj",
    "assets/window_slider_0.obj",
    "assets/window_slider_1.obj",
    "assets/window_slider_2.obj",

  "test.xml",
  "assets/finger_0.obj",
  "assets/finger_1.obj",
  "assets/hand.obj",
  "assets/hand.stl",
  "assets/hand_0.obj",
  "assets/hand_0.obj.mtl",
  "assets/hand_1.obj",
  "assets/hand_2.obj",
  "assets/hand_3.obj",
  "assets/hand_4.obj",

  "bimanual.xml",
  "assets/link0.stl",
  "assets/link0_0.obj",
  "assets/link0_1.obj",
  "assets/link0_10.obj",
  "assets/link0_11.obj",
  "assets/link0_2.obj",
  "assets/link0_3.obj",
  "assets/link0_4.obj",
  "assets/link0_5.obj",
  "assets/link0_7.obj",
  "assets/link0_8.obj",
  "assets/link0_9.obj",
  "assets/link1.obj",
  "assets/link1.stl",
  "assets/link2.obj",
  "assets/link2.stl",
  "assets/link3.stl",
  "assets/link3_0.obj",
  "assets/link3_1.obj",
  "assets/link3_2.obj",
  "assets/link3_3.obj",
  "assets/link4.stl",
  "assets/link4_0.obj",
  "assets/link4_1.obj",
  "assets/link4_2.obj",
  "assets/link4_3.obj",
  "assets/link5_0.obj",
  "assets/link5_1.obj",
  "assets/link5_2.obj",
  "assets/link5_collision_0.obj",
  "assets/link5_collision_1.obj",
  "assets/link5_collision_2.obj",
  "assets/link6.stl",
  "assets/link6_0.obj",
  "assets/link6_1.obj",
  "assets/link6_10.obj",
  "assets/link6_11.obj",
  "assets/link6_12.obj",
  "assets/link6_13.obj",
  "assets/link6_14.obj",
  "assets/link6_15.obj",
  "assets/link6_16.obj",
  "assets/link6_2.obj",
  "assets/link6_3.obj",
  "assets/link6_4.obj",
  "assets/link6_5.obj",
  "assets/link6_6.obj",
  "assets/link6_7.obj",
  "assets/link6_8.obj",
  "assets/link6_9.obj",
  "assets/link7.stl",
  "assets/link7_0.obj",
  "assets/link7_1.obj",
  "assets/link7_2.obj",
  "assets/link7_3.obj",
  "assets/link7_4.obj",
  "assets/link7_5.obj",
  "assets/link7_6.obj",
  "assets/link7_7.obj",
  "assets/table.obj",
  "assets/table.png",
  "assets/table_collision_001.obj",
  "assets/table_collision_002.obj",
  "assets/table_collision_003.obj",
  "assets/table_collision_004.obj",
  "assets/table_collision_005.obj",
  "assets/table_collision_006.obj",
  "assets/table_collision_007.obj",
  "assets/table_legs.obj",

  "kitchen/assets/House/train_34_assets/room|2.obj",
  "kitchen/assets/House/train_34_assets/wall|2|0.00|0.00|0.00|4.96.obj",
  "kitchen/assets/House/train_34_assets/wall|2|0.00|0.00|4.96|0.00.obj",
  "kitchen/assets/House/train_34_assets/wall|2|0.00|4.96|4.96|4.96.obj",
  "kitchen/assets/House/train_34_assets/wall|2|4.96|0.00|4.96|4.96.obj",
  "kitchen/assets/House/train_34_assets/wall|2|4.96|0.00|4.96|4.96_collider0.obj",
  "kitchen/assets/House/train_34_assets/wall|2|4.96|0.00|4.96|4.96_collider1.obj",
  "kitchen/assets/House/train_34_assets/wall|2|4.96|0.00|4.96|4.96_collider2.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|0.00|0.00|0.00|4.96.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|0.00|0.00|4.96|0.00.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|0.00|4.96|4.96|4.96.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|4.96|0.00|4.96|4.96.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|4.96|0.00|4.96|4.96_collider0.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|4.96|0.00|4.96|4.96_collider1.obj",
  "kitchen/assets/House/train_34_assets/wall|exterior|4.96|0.00|4.96|4.96_collider2.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10.xml",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_1.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_2.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_3.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_collision_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_collision_1.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_collision_2.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_collision_3.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/Soap_Bottle_10_collision_4.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SoapBottle/Prefabs/Soap_Bottle_10/material.mtl",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7.xml",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_0_1.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_0_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1_0_collision_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1_0_collision_1.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1_0_collision_2.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1_0_collision_3.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/Doorway_Door_7_mesh_1_0_collision_4.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/LightWoodCounters.png",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/material.mtl",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Doorway_Door_7/material_0.png",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8.xml",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8_collision_0.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8_collision_1.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8_collision_2.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8_collision_3.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8_collision_4.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/Spray_Bottle_8_collision_5.obj",
  "kitchen/assets/ThorAssets/Bathroom Objects/SprayBottle/Prefabs/Spray_Bottle_8/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/Apple_11_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_11/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/Apple_21_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Apple/Prefabs/Apple_21/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_22.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_23.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_24.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_25.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_26.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_28.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_29.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/Bowl_21_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Bowl/Prefabs/Bowl_21/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/DishSponge/Prefabs/Dish_Sponge_1/Dish_Sponge_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/DishSponge/Prefabs/Dish_Sponge_1/Dish_Sponge_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/DishSponge/Prefabs/Dish_Sponge_1/Dish_Sponge_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/DishSponge/Prefabs/Dish_Sponge_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/BrushedAluminum_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_22.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_23.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_24.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_25.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_26.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_28.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_29.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_30.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_31.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_32.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_33.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_34.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_35.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_36.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_37.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_38.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_39.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_40.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_41.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_42.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_43.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_44.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_45.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_46.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_47.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_48.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_49.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_50.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_51.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_52.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_53.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_54.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_55.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_56.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_57.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_58.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_59.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_60.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_61.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_62.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/Fridge_14_FridgeBodyMesh_0_collision_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_FridgeBodyMesh_0/material_0.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_22.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_23.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_24.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_25.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_26.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_28.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_29.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_30.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/Fridge_14_Mesh_2_collision_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_2/material_0.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_22.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_23.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_24.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_25.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_26.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/Fridge_14_Mesh_3_collision_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_Mesh_3/material_0.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/Fridge_14_fridge_drawer1_21_1_collision_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_14_fridge_drawer1_21_1/material_0.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_Decal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Fridge/Prefabs/Fridge_14/Fridge_Readout_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/Ladle_2_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Ladle/Prefabs/Ladle_2/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_5/Lettuce_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_5/Lettuce_5.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_5/Lettuce_5_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_5/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_7/Lettuce_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_7/Lettuce_7.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_7/Lettuce_7_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Lettuce/Prefabs/Lettuce_7/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/BrushedIron_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/HammeredMetal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/Microwave_1_bodymesh_0_collision_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_bodymesh_0/material_0.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_22.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_23.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_24.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_25.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_26.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/Microwave_1_doormesh_1_collision_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_1_doormesh_1/material_0.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_Decal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/Microwave/Prefabs/Microwave_1/Microwave_Window_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/Paper_Towel_1_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/PaperTowel/Prefabs/Paper_Towel_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/Pepper_Shaker_2_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Pepper_Shaker/Prefabs/Pepper_Shaker_2/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_27/Potato_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_27/Potato_27.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_27/Potato_27_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_27/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_29/Potato_29.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_29/Potato_29.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_29/Potato_29_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Potato/Prefabs/Potato_29/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/Salt_Shaker_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/Salt_Shaker_1_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/Salt_Shaker_1_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/Salt_Shaker_1_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/Salt_Shaker_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/Salt_Shaker_1_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/SaltShaker/Prefabs/Salt_Shaker_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spatula/Prefabs/Spatula_1/Spatula_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spatula/Prefabs/Spatula_1/Spatula_1_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spatula/Prefabs/Spatula_1/Spatula_1_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spatula/Prefabs/Spatula_1/Spatula_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spatula/Prefabs/Spatula_1/Spatula_1_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spatula/Prefabs/Spatula_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/Spoon_1_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Spoon/Prefabs/Spoon_1/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_10.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_11.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_12.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_13.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_14.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_15.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_16.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_17.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_18.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_20.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_21.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_22.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_23.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_24.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_25.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_26.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_27.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_28.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_29.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_8.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/Toaster_24_collision_9.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Toaster/Prefabs/Toaster_24/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/Tomato_19_collision_7.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/Tomato/Prefabs/Tomato_19/material.mtl",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1.xml",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_0.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_1.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_2.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_3.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_4.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_5.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/Wine_Bottle_1_collision_6.obj",
  "kitchen/assets/ThorAssets/Kitchen Objects/WineBottle/Prefabs/Wine_Bottle_1/material.mtl",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Countertops/Prefabs/Countertop_L_10x6/Countertop_L_10x6.xml",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Countertops/Prefabs/Countertop_L_10x6/Countertop_L_10x6_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Countertops/Prefabs/Countertop_L_10x6/Countertop_L_10x6_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Countertops/Prefabs/Countertop_L_10x6/Countertop_L_10x6_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Countertops/Prefabs/Countertop_L_10x6/Countertop_L_10x6_collision_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Countertops/Prefabs/Countertop_L_10x6/material.mtl",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7.xml",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_0_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_0_0_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_0_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_0_1_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1_0_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1_0_collision_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1_0_collision_2.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1_0_collision_3.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_1_0_collision_4.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_2.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_2_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_2_0_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_2_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_2_1_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3_0_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3_0_collision_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3_0_collision_2.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3_0_collision_3.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_3_0_collision_4.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_4.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_4_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_4_0_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_4_0_collision_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/Doorway_Double_7_mesh_4_0_collision_2.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/LightWoodCounters.png",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/TexturesCom_WoodFine0050_1_seamless_S.png",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/material.mtl",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Doorways/Prefabs/Doorway_Double_7/material_0.png",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36.xml",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_2.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_0.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_1.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_10.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_11.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_12.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_13.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_14.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_15.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_16.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_2.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_3.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_4.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_5.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_6.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_7.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_8.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/Window_Slider_48x36_collision_9.obj",
  "kitchen/assets/ThorAssets/ManipulaTHOR Objects/Windows/Prefabs/Window_Slider_48x36/material.mtl",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v.xml",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_0.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_1.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_10.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_11.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_12.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_2.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_3.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_4.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_5.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_6.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_7.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_8.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/RoboTHOR_cup_ai2_v_collision_9.obj",
  "kitchen/assets/ThorAssets/RoboTHOR Objects/Cup/Prefabs/RoboTHOR_cup_ai2_v/material.mtl",
  "kitchen/assets/ThorAssets/Textures/Apple1_AlbedoTransparency3.png",
  "kitchen/assets/ThorAssets/Textures/Apple2_AlbedoTransparency3.png",
  "kitchen/assets/ThorAssets/Textures/BrushedAluminum_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/BrushedIron_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/Copper_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/DarkWood2.png",
  "kitchen/assets/ThorAssets/Textures/Fabric2_AlbedoTransparency_resized.png",
  "kitchen/assets/ThorAssets/Textures/Fridge_Decal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/Fridge_Readout_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/HammeredMetal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/HexTiles_resized.png",
  "kitchen/assets/ThorAssets/Textures/Labels.png",
  "kitchen/assets/ThorAssets/Textures/Lettuce1_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/LightWoodCounters.png",
  "kitchen/assets/ThorAssets/Textures/LightWoodCounters_resized.png",
  "kitchen/assets/ThorAssets/Textures/MetalBumpy_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/Microwave_Decal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/Microwave_Window_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/PaperRollDIF.png",
  "kitchen/assets/ThorAssets/Textures/PepperNoise.png",
  "kitchen/assets/ThorAssets/Textures/Potato1_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/Potato3_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/RoboTHOR_Cup_Primary_AI2_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/SpongeGreenYellow.png",
  "kitchen/assets/ThorAssets/Textures/SprayBottle1_DefaultMaterial_AlbedoTransparency 7.png",
  "kitchen/assets/ThorAssets/Textures/TexturesCom_WoodFine0050_1_seamless_S.png",
  "kitchen/assets/ThorAssets/Textures/Toaster_Decal_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/Tomato2_AlbedoTransparency.png",
  "kitchen/assets/ThorAssets/Textures/bathroomTilesTan2.png",
  "kitchen/assets/ThorAssets/Textures/marbleBase2.png",
  "kitchen/kitchen_v0.xml",

    "shadow_hand/assets/f_distal_pst.obj",
    "shadow_hand/assets/f_knuckle.obj",
    "shadow_hand/assets/f_middle.obj",
    "shadow_hand/assets/f_proximal.obj",
    "shadow_hand/assets/forearm_0.obj",
    "shadow_hand/assets/forearm_1.obj",
    "shadow_hand/assets/forearm_collision.obj",
    "shadow_hand/assets/lf_metacarpal.obj",
    "shadow_hand/assets/mounting_plate.obj",
    "shadow_hand/assets/palm.obj",
    "shadow_hand/assets/th_distal_pst.obj",
    "shadow_hand/assets/th_middle.obj",
    "shadow_hand/assets/th_proximal.obj",
    "shadow_hand/assets/wrist.obj",
    "shadow_hand/left_hand.xml",
    "shadow_hand/right_hand.xml",
    "shadow_hand/scene_left.xml",
    "shadow_hand/scene_right.xml",
    "simple.xml",
    "slider_crank.xml",
    "model_with_tendon.xml",
  ];

  let requests = allFiles.map((url) => fetch("./examples/scenes/" + url));
  let responses = await Promise.all(requests);
  for (let i = 0; i < responses.length; i++) {
      let split = allFiles[i].split("/");
      let working = '/working/';
      for (let f = 0; f < split.length - 1; f++) {
          working += split[f];
          if (!mujoco.FS.analyzePath(working).exists) { mujoco.FS.mkdir(working); }
          working += "/";
      }

      if (allFiles[i].endsWith(".png") || allFiles[i].endsWith(".stl") || allFiles[i].endsWith(".skn")) {
          mujoco.FS.writeFile("/working/" + allFiles[i], new Uint8Array(await responses[i].arrayBuffer()));
      } else {
          mujoco.FS.writeFile("/working/" + allFiles[i], await responses[i].text());
      }
  }
}

/** Access the vector at index, swizzle for three.js, and apply to the target THREE.Vector3
 * @param {Float32Array|Float64Array} buffer
 * @param {number} index
 * @param {THREE.Vector3} target */
export function getPosition(buffer, index, target, swizzle = true) {
  if (swizzle) {
    return target.set(
       buffer[(index * 3) + 0],
       buffer[(index * 3) + 2],
      -buffer[(index * 3) + 1]);
  } else {
    return target.set(
       buffer[(index * 3) + 0],
       buffer[(index * 3) + 1],
       buffer[(index * 3) + 2]);
  }
}

/** Access the quaternion at index, swizzle for three.js, and apply to the target THREE.Quaternion
 * @param {Float32Array|Float64Array} buffer
 * @param {number} index
 * @param {THREE.Quaternion} target */
export function getQuaternion(buffer, index, target, swizzle = true) {
  if (swizzle) {
    return target.set(
      -buffer[(index * 4) + 1],
      -buffer[(index * 4) + 3],
       buffer[(index * 4) + 2],
      -buffer[(index * 4) + 0]);
  } else {
    return target.set(
       buffer[(index * 4) + 0],
       buffer[(index * 4) + 1],
       buffer[(index * 4) + 2],
       buffer[(index * 4) + 3]);
  }
}

/** Converts this Vector3's Handedness to MuJoCo's Coordinate Handedness
 * @param {THREE.Vector3} target */
export function toMujocoPos(target) { return target.set(target.x, -target.z, target.y); }

/** Standard normal random number generator using Box-Muller transform */
export function standardNormal() {
  return Math.sqrt(-2.0 * Math.log( Math.random())) *
         Math.cos ( 2.0 * Math.PI * Math.random()); }

