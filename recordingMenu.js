import OBR from "@owlbear-rodeo/sdk";
import {ID, pathCreations} from "./globalVariables";
import {renderList} from "./recordingLists.js";

function isDict(variable) {
  return variable && typeof variable === 'object' && !Array.isArray(variable);
}

export function setupRecordingMenu() {
  OBR.contextMenu.create({
    id: `${ID}/recordingMenu`,
    icons: [
      {
        icon: "/add.svg",
        label: "Start recording",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", `${ID}/recording`], value: undefined },
          ],
        },
      },
      {
        icon: "/remove.svg",
        label: "Stop recording",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick(context) {
      const addToInitiative = context.items.every(
        (item) => item.metadata[`${ID}/recording`] === undefined
      );
      if (addToInitiative) {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            item.metadata[`${ID}/recording`] = {
              recording: true
            };
            pathCreations[item.id] = [{
                x: item.position.x,
                y: item.position.y,
                rotation: item.rotation,
                time: 0
            }]
          }
        });
      } else {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            delete item.metadata[`${ID}/recording`];
            try {
              const ms = parseInt(window.prompt("Time return (ms): "));
              pathCreations[item.id][pathCreations[item.id].length - 1].time = ms;
              const name = window.prompt("Name recording: ");
              if (!isDict(item.metadata[`${ID}/path`])) {
                item.metadata[`${ID}/path`] = {}
              }
              item.metadata[`${ID}/path`][name] = pathCreations[item.id];
              console.log(name)
            } catch (e) {
              console.log(e)
            }
          }
        });
        renderList()
      }
    },
  });
}
