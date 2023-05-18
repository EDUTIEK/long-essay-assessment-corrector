import { defineStore } from 'pinia';
import localForage from "localforage";
import Points from '@/data/Points'

const storage = localForage.createInstance({
    storeName: "corrector-points",
    description: "Corrector points data",
});

/**
 * Points Store
 */
export const usePointsStore = defineStore('points',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            points: [],             // list of points objects
        }
    },

    getters: {
        hasPoints: (state) => state.points.length > 0,

        getPoints(state) {
            return (key) => state.points.find(element => element.key == key)
        },
    },

    actions: {

        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        async loadFromStorage() {
            try {
                const keys = await storage.getItem('pointsKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.points = [];

                let index = 0;
                while (index < this.keys.length) {
                    let points = await storage.getItem(this.keys[index]);
                    this.points.push(points);
                    index++;
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {
            try {
                await storage.clear();

                this.keys = [];
                this.points = [];

                let index = 0;
                while (index < data.length) {
                    let points_data = data[index];
                    let points = new Points(points_data);
                    this.points.push(points);
                    this.keys.push(points.key);
                    await storage.setItem(points.key, points.getData());
                    index++;
                }

                await storage.setItem('pointsKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});
