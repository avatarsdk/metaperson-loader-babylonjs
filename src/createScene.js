/* Copyright (C) Itseez3D, Inc. - All Rights Reserved
 * You may not use this file except in compliance with an authorized license
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * UNLESS REQUIRED BY APPLICABLE LAW OR AGREED BY ITSEEZ3D, INC. IN WRITING, SOFTWARE DISTRIBUTED UNDER THE LICENSE IS DISTRIBUTED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED
 * See the License for the specific language governing permissions and limitations under the License.
 * Written by Itseez3D, Inc. <support@itseez3D.com>, April 2024
 */

export function createScene(canvas, config) {
  const engine = new BABYLON.Engine(canvas, true, { antialias: true });

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0xa0/256, 0xa0/256, 0xa0/256);

  engine.runRenderLoop(function () {
    scene.render();
  });

  const camera = new BABYLON.ArcRotateCamera("Camera",-(Math.PI / 2), Math.PI / 2, 10, new BABYLON.Vector3(0, 0, 0), scene);

  camera.alpha += Math.PI;
  camera.setPosition(new BABYLON.Vector3(config.camera.pos.x, config.camera.pos.y, config.camera.pos.z))
  camera.setTarget(new BABYLON.Vector3(config.camera.lookAt.x, config.camera.lookAt.y, config.camera.lookAt.z));

  camera.lowerRadiusLimit = 0.3;
  camera.wheelPrecision = 300;
  camera.minZ = 0.1;
  camera.maxZ = 100;

  camera.attachControl(canvas, false);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 1;

  return scene;
}