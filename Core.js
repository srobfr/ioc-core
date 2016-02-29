var Q = require('q');
var _ = require('lodash');

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
     * Charge tous les composants demandés avec leurs dépendances.
     *
     * @param names
     */
    that.getComponents = function(names) {
        var result = {};
        var promises = _.map(names, function(name) {
            if (that.components[name] !== undefined) {
                return Q(that.components[name]);
            }

            // Il faut charger le composant.
            var ComponentClass = require(that.config.ioc[name]);
            var componentInstance = new ComponentClass(that);
            var p = Q();
            if (componentInstance.init !== undefined) {
                p = p
                    .then(function() {
                        return componentInstance.init();
                    });
            }

            p = p
                .then(function() {
                    that.components[name] = componentInstance;
                    result[name] = componentInstance;
                });
            return p;
        });

        return Q.all(promises)
            .then(function() {
                return result;
            });
    };
};

module.exports = Core;