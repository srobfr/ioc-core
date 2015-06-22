var Q = require('q');
var _ = require('underscore');

/**
 * IOC Core
 *
 * @param config Global configuration
 *
 * @constructor
 */
var Core = function Core(config) {
    var that = this;

    /**
     * Already loaded components.
     *
     * @type Object
     */
    that.components = {core: that};

    /**
     * Configuration
     */
    that.config = config;

    /**
     * Retourne une promise accomplie lorsque l'initialisation est terminée.
     */
    that.init = function () {
        return loadComponents()
            .then(function(){}, function(err) {
                console.error(err.stack);
                throw err;
            });
    };

    /**
     * Charge les composants définis dans la config that.config.ioc.
     *
     * @returns {Promise}
     */
    function loadComponents() {
        return Q.fcall(function () {
            if (that.config.ioc === undefined) {
                throw Error("Missing IOC Config.");
            }

            var componentsClasses = {};
            var componentsDependencies = {};
            var invertedDeps = {};

            _.each(that.config.ioc, function (path, name) {
                // On require() le composant.
                var componentClass = require(path);

                // Ensuite on parse la signature de son constructeur, afin de connaître ses dépendances.
                var re = /^function +[a-zA-Z0-9_]* *\(([^\)]*)\)/;
                var m = re.exec(componentClass.toString());
                if (m === null) {
                    // La signature du composant a un problème de syntaxe.
                    throw Error("The component '" + name + "' does not respect the constructor parameters formatting.");
                }

                var componentDependencies = [];
                if (undefined !== m[1]) {
                    componentDependencies = _.map(m[1].split(','), function (dep) {
                        return dep.trim();
                    });
                }

                componentsClasses[name] = componentClass;
                componentsDependencies[name] = componentDependencies;

                _.each(componentDependencies, function (dep) {
                    if (dep === "core") return;
                    if (undefined === invertedDeps[dep]) invertedDeps[dep] = [];
                    invertedDeps[dep].push(name);
                });
            });

            return tryToLoadComponents(_.keys(componentsClasses), invertedDeps, componentsClasses, componentsDependencies)
                .then(function () {
                    var loaded = _.keys(that.components);
                    var all = _.keys(componentsClasses);

                    if (loaded.length - 1 < all.length) {
                        throw new Error("Impossible de résoudre les dépendances : "
                            + _.difference(all, loaded).join(", "));
                    }
                });
        });
    }

    /**
     * Tente de charger une liste de composants.
     *
     * @param componentsNames
     * @param invertedDeps
     * @param componentClasses
     * @param componentsDependencies
     * @return {*}
     */
    function tryToLoadComponents(componentsNames, invertedDeps, componentClasses, componentsDependencies) {
        var ps = [];

        _.each(componentsNames, function (name) {
            if (that.components[name] !== undefined) {
                // Déjà chargé.
                return;
            }

            // On vérifie la disponibilité des dépendances du composant.
            var fail = _.find(componentsDependencies[name], function (dep) {
                return (that.components[dep] === undefined);
            });

            if (fail) {
                // Il manque au moins une dépendance.
                return;
            }

            // Ok, on peut charge ce composant.
            var p = loadOneComponent(name, componentsDependencies[name], componentClasses[name])
                .then(function () {
                    return tryToLoadComponents(invertedDeps[name], invertedDeps, componentClasses, componentsDependencies);
                });
            ps.push(p);
        });

        return Q.all(ps);
    }

    /**
     * Charge un composant, lorsque toutes ses dépendances sont satisfaites.
     * @param name
     */
    function loadOneComponent(name, dependencies, componentClass) {
        if (!componentClass) {
            throw new Error("Unable to load component : " + name);
        }

        var componentParams = _.map(dependencies, function (dep) {
            return that.components[dep];
        });

        // Instanciation du composant avec des paramètres dynamiques
        var Temp = function () {};
        Temp.prototype = componentClass.prototype;
        var inst = new Temp;
        var ret = componentClass.apply(inst, componentParams);
        var componentInstance = Object(ret) === ret ? ret : inst;

        // On initialise le composant (si une méthode publique init() existe).
        return Q.fcall(componentInstance.init || function () {})
            .then(function () {
                // Enfin on le rend disponible pour ceux qui en dépendent.
                that.components[name] = componentInstance;
            });
    }
};

module.exports = Core;