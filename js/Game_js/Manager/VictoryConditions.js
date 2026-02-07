import Phaser from "phaser";

export default class VictoryConditions {
    constructor(scene) {
        this.scene = scene;
        this.CAPTURE_RADIUS = 150;
        this.CAPTURE_TIME = 5000;   // 5 secondes en millisecondes == durée du timer
        this.gameOver = false;
    }

    update() {
        if (this.gameOver) {
            return;
        }
        this.checkAllCamps();
    }

    checkAllCamps() {
        let camps = this.getCamps();
        let delta = this.scene.game.loop.delta;

        for (let i = 0; i < camps.length; i++) {
            let camp = camps[i];
            let unitesProches = this.getUnitsNearCamp(camp);
            let owners = this.getUniqueOwners(unitesProches);

            // personne autour donc on reset le timer
            if (unitesProches.length === 0) {
                camp.captureBy = null;
                camp.captureProgress = 0;
                continue;
            }

            // si plusieurs joueurs le timer est en pause
            if (owners.length > 1) {
                continue;
            }

            let capturer = owners[0];

            // deja son camp donc on fait rien
            if (camp.owner === capturer) {
                camp.captureBy = null;
                camp.captureProgress = 0;
                continue;
            }

            // si le captureur a change, on reset le timer
            if (camp.captureBy !== null && camp.captureBy !== capturer) {
                camp.captureBy = null;
                camp.captureProgress = 0;
            }

            // demarre le timer
            if (camp.captureBy === null) {
                camp.captureBy = capturer;
                camp.captureProgress = 0;
            }

            camp.captureProgress = camp.captureProgress + delta;

            // Debug de con en console
            let pourcentage = Math.round((camp.captureProgress / this.CAPTURE_TIME) * 100);
            if (pourcentage > 100) { pourcentage = 100; }
            console.log("Camp " + i + " - Capture par joueur " + capturer + " : " + pourcentage + "%");

            // timer a 100% donc changement de proprietaire du camp
            if (camp.captureProgress >= this.CAPTURE_TIME) {
                this.changeCampOwner(camp, capturer);
                camp.captureBy = null;
                camp.captureProgress = 0;
            }
        }
    }

    checkVictory() {
        let camps = this.getCamps();

        if (camps.length === 0) {
            return;
        }

        // On recupere seulement les camps qui ne sont pas neutres
        let campsPossedes = [];
        for (let i = 0; i < camps.length; i++) {
            if (camps[i].owner !== -1) {
                campsPossedes.push(camps[i]);
            }
        }

        // Aucun camp possede = pas de gagnant
        if (campsPossedes.length === 0) {
            return;
        }

        // On regarde combien de joueurs differents possedent des camps
        let owners = this.getUniqueOwners(campsPossedes);

        // Si un seul joueur possede tout = victoire
        if (owners.length === 1) {
            this.printVictory(owners[0]);
        }
    }

    

    // Recupere la liste des camps
    getCamps() {
        if (this.scene.MapManager && this.scene.MapManager.camps) {
            return this.scene.MapManager.camps;
        }
        return [];
    }

    // Renvoie les unites qui sont dans le rayon du camp
    getUnitsNearCamp(camp) {
        let units = [];
        if (this.scene.movesManager && this.scene.movesManager.registeredUnits) {
            units = this.scene.movesManager.registeredUnits;
        }

        let result = [];
        for (let i = 0; i < units.length; i++) {
            let dist = Phaser.Math.Distance.Between(
                units[i].x, units[i].y,
                camp.x, camp.y
            );
            if (dist <= this.CAPTURE_RADIUS) {
                result.push(units[i]);
            }
        }
        return result;
    }

    // Renvoie les owners sans doublons
    // Exemple : [{owner:0}, {owner:1}, {owner:0}] → [0, 1]
    getUniqueOwners(list) {
        let owners = [];
        for (let i = 0; i < list.length; i++) {
            if (!owners.includes(list[i].owner)) {
                owners.push(list[i].owner);
            }
        }
        return owners;
    }

    
    changeCampOwner(camp, newOwner) {
        let oldOwner = camp.owner;
        camp.owner = newOwner;

        if (newOwner === 0) {
            camp.setTint(0xff0000);     // Rouge = joueur
        } else if (newOwner > 0) {
            camp.setTint(0x0000ff);     // Bleu = IA
        } else {
            camp.setTint(0x808080);     // Gris = neutre
        }

        console.log("Camp capture ! Owner " + oldOwner + " -> " + newOwner);

        // On verifie la victoire uniquement quand un camp change de main
        this.checkVictory();
    }

    // Fin de partie
    printVictory(winnerId) {
        this.gameOver = true;

        if (winnerId === 0) {
            console.log("VICTOIRE ! Le joueur a capture tous les camps !");
        } else {
            console.log("DEFAITE... Le joueur " + winnerId + " a gagne.");
        }
        //ca permettra de creer un event pour afficher un panneau de victoire/défaite
        this.scene.registry.events.emit("gameOver", {
            winner: winnerId,
            isPlayerWin: winnerId === 0
        });
    }
}
