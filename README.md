# ioc-core
Simple inversion of control core component for NodeJs.

Injects components dependencies and config into other components.

# Installation

    npm install ioc-core

# Usage

## Core boostrap

    var Core = require('ioc-core');
    var core = new Core({
        // This map contains a list of components to load
        ioc: {
            componentName: "/path/to/ComponentClass.js",
            otherComponent: "/path/to/OtherComponent.js",
            myComponent: "/path/to/MyComponent.js",
        },

        // This config will be available in all components in core.config
        foo: "bar",
        foo2: "bar2"
    });

    // Load every components
    core.init()
        // init() returns a promise, so use this to rethrow any error thrown during init().
        .done();

## Components

Every component should respect one of the following formats :

    var foo = require('bar');
    // requires...

    // Specify any required components in the constructor parameters
    var MyComponent = function MyComponent(core, componentName, otherComponent) {
        // Here you can use componentName and otherComponent, which are instances of ComponentClass and OtherComponent.
        // You can also use core.config, which is the object initially passed to your core constructor.
        // core.components contains a map of all instanciated components.

        console.log(core.config.foo); // Displays "bar"
        console.log(core.components.otherComponent === otherComponent); // true
        console.log(core.components.myComponent === this); // true

        // "core" as constructor parameter is optional. In fact, core is just one of the available components.
    };

    module.exports = MyComponent;

Or :

    var foo = require('bar');

    function MyComponent(core, componentName, otherComponent) {
    }

    module.exports = MyComponent;
