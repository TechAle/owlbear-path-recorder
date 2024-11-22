import OBR from "@owlbear-rodeo/sdk";
import {ID, pathCreations} from "./globalVariables";

async function animation(id) {
  const globalItems = await OBR.scene.items.getItems([id]);
  //console.log(globalItems)
  // Add the global item to the local scene
  await OBR.scene.local.addItems(globalItems);
  //console.log(items)
  // WHY ARE YALL USING PROXY FUCKING HELL
  let lenPath;
  let i = 0;
  let running = false
  let path = [];
  while (!running) {
    await OBR.scene.local.updateItems([id], (items) => {
      let item = items[0]
      // Something fucks up when transforming the scene item into local
      item.metadata[`${ID}/moving`] = {
        moving: true
      };
      item.position.x = item.metadata[`${ID}/path`][0].x;
      item.position.y = item.metadata[`${ID}/path`][0].y;
      lenPath = item.metadata[`${ID}/path`].length;
      running = item.metadata[`${ID}/moving`] !== undefined;
      if (running) {
        // I hate proxy
        for(let i = 0; i < lenPath; i++) {
          path.push({
            x: item.metadata[`${ID}/path`][i].x,
            y: item.metadata[`${ID}/path`][i].y,
            rotation: item.metadata[`${ID}/path`][i].rotation,
            time: item.metadata[`${ID}/path`][i].time
          })
        }
      } else {
        setTimeout(() => {}, 100)
      }
    });
  }
  while (running) {

    let currentX = path[i].x;
    let currentY = path[i].y;
    let currentRotation = path[i].rotation;
    let nextX = path[(i + 1) % lenPath].x;
    let nextY = path[(i + 1) % lenPath].y;
    let nextRotation = path[(i + 1) % lenPath].rotation;
    let time = path[i].time;
    let distance = Math.sqrt((nextX - currentX) ** 2 + (nextY - currentY) ** 2);
    let distanceRotation = Math.abs(nextRotation - currentRotation);
    // Dynamic number of steps based on the distance
    let scaleFactor = 0.25; // Adjust this value based on how smooth you want the movement
    let numSteps = Math.max(Math.floor(distance * scaleFactor), 1, Math.floor(distanceRotation * scaleFactor)); // Ensure at least 1 step
    console.log(numSteps)
// Calculate the time per step (in milliseconds)
    let stepTime = (time) / numSteps; // Convert time to milliseconds

// Calculate the step size in both X and Y directions
    let stepX = (nextX - currentX) / numSteps;
    let stepY = (nextY - currentY) / numSteps;
    let stepRotation = (nextRotation - currentRotation) / numSteps;

    for (let j = 0; j < numSteps; j++) {
      // Calculate the new intermediate position
      let newX = currentX + stepX * (j + 1);
      let newY = currentY + stepY * (j + 1);
      let newRotation = currentRotation + stepRotation * (j + 1);

      // Update position locally
      await OBR.scene.local.updateItems([id], (items) => {
        let item = items[0];
        //console.log(item);
        item.position = { x: newX, y: newY };
        item.rotation = newRotation
        running = item.metadata[`${ID}/moving`] !== undefined;
      });
      if (!running) break

      // Add a delay for smooth animation
      await new Promise((resolve) => setTimeout(resolve, stepTime)); // Adjust delay as needed
    }

    if (!running) break

    // Ensure the final position matches the target
    await OBR.scene.local.updateItems([id], (items) => {
      let item = items[0];
      item.position = { x: nextX, y: nextY };
      running = item.metadata[`${ID}/moving`] !== undefined;
    });

    // Move to the next path point
    i = (i + 1) % lenPath;
  }

}

export function setupContextMenu2() {
  OBR.contextMenu.create({
    id: `${ID}/context-menu2`,
    icons: [
      {
        icon: "/add.svg",
        label: "Start moving",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", `${ID}/moving`], value: undefined },
          ],
        },
      },
      {
        icon: "/remove.svg",
        label: "Stop moving",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick(context) {
      const addToInitiative = context.items[0].metadata[`${ID}/moving`] === undefined;
      if (addToInitiative) {
        OBR.scene.items.updateItems(context.items,  (items) => {
          for (let item of items) {
            item.metadata[`${ID}/moving`] = {
              moving: true
            };
            let id = item.id;

            animation(id)

          }
        });
      }
      else {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            delete item.metadata[`${ID}/moving`];
          }
        });
      }
    },
  });
}
