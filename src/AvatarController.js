/* Copyright (C) Itseez3D, Inc. - All Rights Reserved
 * You may not use this file except in compliance with an authorized license
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * UNLESS REQUIRED BY APPLICABLE LAW OR AGREED BY ITSEEZ3D, INC. IN WRITING, SOFTWARE DISTRIBUTED UNDER THE LICENSE IS DISTRIBUTED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED
 * See the License for the specific language governing permissions and limitations under the License.
 * Written by Itseez3D, Inc. <support@itseez3D.com>, April 2024
 */

export class AvatarController {
  busy = false;

  haircutRenderPasses = 1;

  haircut = null;

  haircut2a = null;
  haircut2b = null;

  haircut3a = null;
  haircut3b = null;
  haircut3c = null;

  shortThreshold = 40;
  longThreshold = 100;

  prevTimestamp = 0;
  sumFastFrames = 0;
  sumLongFrames = 0;

  constructor() {
    this.clearModel();

    const animate = timestamp => {
      requestAnimationFrame(animate);

      const delta = timestamp - this.prevTimestamp;
      this.prevTimestamp = timestamp;

      this.updateDeltaSums(delta);

      this.checkAndUpdateHaircutRenderPasses();
    };

    animate();
  }

  updateDeltaSums(delta) {
    if (delta < this.shortThreshold) {
      this.sumFastFrames += delta;
      this.sumLongFrames = 0;
    }

    if (delta > this.longThreshold) {
      this.sumLongFrames += delta;
      this.sumFastFrames = 0;
    }
  }

  checkAndUpdateHaircutRenderPasses() {
    if (this.sumFastFrames >= 1000) {
      const maxHaircutRenderPasses = 3;
      if (this.haircutRenderPasses < maxHaircutRenderPasses) 
        this.setHaircutRenderPasses(this.haircutRenderPasses + 1);
      this.sumFastFrames = 0;
    }

    if (this.sumLongFrames >= 1000) {
      const minHaircutRenderPasses = 1;
      if (this.haircutRenderPasses > minHaircutRenderPasses) 
        this.setHaircutRenderPasses(this.haircutRenderPasses - 1);
      this.sumLongFrames = 0;
    }
  }

  clearModel() {
    if (!this.model?.meshes) return;

    for (let i = 0; i < this.model.meshes.length; i++) {
      if (this.model.meshes[i].material) this.model.meshes[i].material.dispose();
      this.model.meshes[i].dispose();
    }
  }

  async loadModel(url, scene, callback) {
    try {
      this.busy = true;

      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync("", url, scene);
      const meshes = container.meshes;
      const materials = container.materials;

      this.removeFromScene();
      this.clearModel();

      this.model = container;

      this.haircut = this.model.meshes.find((element) => element.id === "haircut");
      if (this.haircut) this.prepareHaircut();

      callback(this);

      this.busy = false;

    } catch (error) {
      console.error("Error loading model:", error);
      this.busy = false;
    }
  }

  prepareHaircut() {
    this.prepareHaircutFor2Passes();
    this.prepareHaircutFor3Passes();
  }

  prepareHaircutFor2Passes() {
    if (this.haircut===undefined) return;

    const material2a = this.createHaircutMaterial("material2a", BABYLON.Material.DOUBLESIDE);
    material2a.opacity = 0.8;
    material2a.alphaMode = BABYLON.Constants.ALPHA_COMBINE;
    material2a.depthFunc = BABYLON.Constants.LESS;
    material2a.depthTest = true;
    material2a.depthWrite = false;
    material2a.roughness = 0.6;
    material2a.blendDst = BABYLON.Constants.GL_ONE_MINUS_DST_COLOR;
    material2a.useSmoothShading = true;

    const material2b = this.createHaircutMaterial("material2b", BABYLON.Material.FRONTSIDE)
    material2b.opacity = 0.8;
    material2b.alphaMode = BABYLON.Constants.ALPHA_COMBINE;
    material2b.depthTest = true;
    material2b.alphaTest = 0.65;

    this.haircut2a = this.createHaircutClone("haircut2a", material2a);
    this.haircut2b = this.createHaircutClone("haircut2b", material2b);

    this.model.meshes.push(this.haircut2a);
    this.model.meshes.push(this.haircut2b);
  }

  prepareHaircutFor3Passes() {
    if (this.haircut===undefined) return;

    const material3a = this.createHaircutMaterial("material3a", BABYLON.Material.BACKSIDE);
    material3a.disableDepthWrite = true;

    const material3b = this.createHaircutMaterial("material3b", BABYLON.Material.FRONTSIDE);
    material3b.disableDepthWrite = true;

    const material3c = this.haircut.material.clone("material2c", BABYLON.Material.DOUBLESIDE);
    material3c.disableDepthWrite = false;

    this.haircut3a = this.createHaircutClone("haircut3a", material3a);
    this.haircut3b = this.createHaircutClone("haircut3b", material3b);
    this.haircut3c = this.createHaircutClone("haircut3c", material3c);

    this.model.meshes.push(this.haircut3a);
    this.model.meshes.push(this.haircut3b);
    this.model.meshes.push(this.haircut3c);
  }

  createHaircutMaterial(name, sideOrientation) {
    const material = this.haircut.material.clone(name);

    material.sideOrientation = sideOrientation;
    
    material.transparent = true;
    material.needsUpdate = true;

    return material;
  }

  createHaircutClone(name, material) {
    const clone = this.haircut.clone();
    clone.id = clone.name = name;
    clone.isVisible = false;
    clone.material = material;
    return clone;
  }

  addToScene() {
    this.model.addAllToScene();
  }

  removeFromScene() {
    const scene = this.model?.scene;
    if (!scene) return;

    for (let i = 0; i < this.model.meshes.length; i++) {
      scene.removeMesh(this.model.meshes[i]);
    }
  }

  setHaircutRenderPasses(passes) {
    this.haircutRenderPasses = passes;

    if (this.haircut === undefined) return;

    this.haircut.isVisible = passes === 1;
    this.haircut2a.isVisible = this.haircut2b.isVisible = passes === 2;
    this.haircut3a.isVisible = this.haircut3b.isVisible = this.haircut3c.isVisible = passes === 3;
  }

}
