function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : null;
}


const modelIdInput = document.getElementById('model-id');
const entityIdInput = document.getElementById('entity-id');
const groupNameInput = document.getElementById('group-name');
const refreshGroupButton = document.getElementById('refresh-group');
const addGroupButton = document.getElementById('add-group');
const groupsDiv = document.getElementById('groups');

let scene = new xeogl.Scene({
    transparent: true
});

xeogl.setDefaultScene(scene);

let model1 = new xeogl.GLTFModel({
    id: "model1",
    src: "./xl.gltf",
    handleNode: function (nodeInfo, actions) {
        if (nodeInfo.name && nodeInfo.mesh !== undefined) {
            actions.createObject = {
                id: `${makeid(10)}`,
                meta: {
                    id: nodeInfo.name,
                    projectId: 'my_awesome_ifc_1'
                },
                entityType: "house"
            };
        }
        return true;
    },
    scale: [.01, .01, .01],
    position: [0, 0, 0]
});

let model2 = new xeogl.GLTFModel({
    id: "model2",
    src: "./test.gltf",
    handleNode: function (nodeInfo, actions) {
        if (nodeInfo.name && nodeInfo.mesh !== undefined) {
            actions.createObject = {
                id: `${makeid(10)}`,
                meta: {
                   id: nodeInfo.name,
                   projectId: 'my_awesome_ifc_2'
                }
            };
        }
        return true;
    },
    scale: [.01, .01, .01],
    position: [0.15, 0, 0]
});

let camera = model2.scene.camera;

camera.eye = [-0.6461755037307739, 1.0832817554473877, -0.6558935642242432];
camera.look = [1.128140926361084, -0.40583744645118713, -1.1894490718841553];
camera.up = [0.599919319152832, 0.7794561982154846, -0.18040208518505096];

let cameraControl = new xeogl.CameraControl({
    panToPointer: true,
    pivoting: true
});

let cameraFlight = new xeogl.CameraFlightAnimation();
let input = scene.input;
let lastEntity = null;
let lastColorize = null;

let entityLastColorizeMap = {};
let entityGroup = [];
let entityGroups = {};

input.on("mousedown", function (coords) {
  let hit = scene.pick({
      canvasPos: coords
  });
  if (hit) {

    if (window.event.ctrlKey) {
        entityGroup.push(hit.mesh);
        entityLastColorizeMap[hit.mesh.id] = hit.mesh.colorize.slice();
        hit.mesh.colorize = [1.0, 0.0, 0.0, 1.0];
        return;
    }

    if (!lastEntity || hit.mesh.id !== lastEntity.id) {
      if (lastEntity) {
          lastEntity.colorize = lastColorize;
      }
      lastEntity = hit.mesh;
      lastColorize = hit.mesh.colorize.slice();
      hit.mesh.colorize = [0.0, 1.0, 0.0, 1.0];
      entityIdInput.value = hit.mesh.meta.id;
      modelIdInput.value = hit.mesh.meta.projectId;
    }
  } else {
    if (lastEntity) {
      lastEntity.colorize = lastColorize;
      lastEntity = null;
      entityIdInput.value = '';
      modelIdInput.value = '';
    }
  }
});

function refreshGroup() {
    entityGroup.forEach(e => {
        e.colorize = entityLastColorizeMap[e.id];
    });
    entityGroup = [];
    entityLastColorizeMap = {};
}

function renderGroupLi(groupName) {
    const table = document.getElementById('groups');
    const row = document.createElement('div');
    row.className = 'group-info';

    const name = document.createElement('span');
    name.className = 'group-name';
    name.innerHTML = groupName;
    row.appendChild(name);

    const colorInput = document.createElement('input');
    colorInput.className = 'group-color'
    colorInput.type = 'color';
    colorInput.value = '#ff0000';
    colorInput.addEventListener('change', (e) => {
        colorizeGroup(groupName, e.target.value);
    });
    row.appendChild(colorInput);

    const hideBtn = document.createElement('button');
    hideBtn.innerHTML = 'Hide/Show';
    hideBtn.className = 'hide-button';
    hideBtn.addEventListener('click', () => {
        hideGroup(groupName);
    });
    row.appendChild(hideBtn);

    table.appendChild(row);
}

addGroupButton.addEventListener('click', function() {
    const name = groupNameInput.value;
    if (name === '') return alert('Group name must be filled');
    if (entityGroup.length === 0) return alert('Group must contains entities');
    entityGroups[name] = entityGroup;
    renderGroupLi(name);
    refreshGroup();
    groupNameInput.value = '';
    colorizeGroup(name, '#ff0000');
});

refreshGroupButton.addEventListener('click', () => {
    refreshGroup();
});

function colorizeGroup(name, color) {
    const rgb = hexToRgb(color);
    const group = entityGroups[name];
    group.forEach(e => {
        e.colorize = [...rgb, 1.0];
    })
}

function hideGroup(name) {
    const group = entityGroups[name];
    group.forEach(e => {
        e.culled = !e.culled;
    })
}