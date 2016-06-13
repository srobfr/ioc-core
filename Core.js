var _ = require("lodash");
var Promise = require("bluebird");

/**
 * Core IOC.
 */
function Core() {
    var that = this;

    /**
     * Dictionnaire des composants.
     *
     * @type {Object.<string,Promise.<Object>>}
     */
    var components = {};

    /**
     * Configuration globale.
     *
     * @type {Object.<string,Object>}
     */
    that.config;

    /**
     * Charge une liste de composants et retourne une promise.
     *
     * @param {(...string|Array.<string>)} names La liste du ou des composants à charger.
     *
     * @return {Promise.<Array.<Object>>}
     */
    that.load = function (names) {
        names = (_.isArray(names) ? names : _.toArray(arguments));

        var result = [];
        _.each(names, function (name) {
            result.push(loadOneComponent(name));
        });

        if(result.length > 1) return Promise.all(result);
        return _.first(result);
    };

    /**
     * Charge un composant et retourne une promise.
     *
     * @param {string} name Le nom du composant à charger.
     *
     * @return {Promise.<Object>}
     */
    function loadOneComponent(name) {
        // Si le composant est déjà chargé, on le retourne.
        if (components[name] !== undefined) return components[name];

        // Le composant n'est pas encore chargé.
        // On tente de le trouver dans la conf IOC.
        if (!that.config) throw new Error("La configuration est indéfinie.");
        if (!that.config.ioc || !that.config.ioc[name]) throw new Error(`La configuration ioc est indéfinie pour le composant "${name}".`);

        // Le composant a un chemin défini.
        var componentPath = that.config.ioc[name];
        var componentClass = require(componentPath);
        var componentClassStr = componentClass.toString();

        // Si le constructeur du composant a des arguments, on va tenter de les charger comme dépendances.
        var m = componentClassStr.match(/^function +[\$a-zA-Z_][\$\w_]*\((.+?)\)[ \t\r\n]*\{/);
        var pDependencies;
        if (m) {
            var constructorArgs = m[1].split(/[ \t\r\n]*,[ \t\r\n]*/);
            pDependencies = that.load(constructorArgs);
        } else {
            pDependencies = Promise.resolve([]);
        }

        // Une fois les dépendances résolues, on instancie le composant.
        var pComponent = pDependencies.then(function(dependenciesInstances) {
            var args = [null].concat(dependenciesInstances);
            var instance = new (componentClass.bind.apply(componentClass, args));

            if (typeof instance.init === "function") {
                return Promise.resolve(instance.init()).then(function() {
                    return instance;
                });
            }
            return instance;
        });

        // On le stocke...
        components[name] = pComponent;

        // Puis on le retourne.
        return pComponent;
    }
}

module.exports = new Core();
