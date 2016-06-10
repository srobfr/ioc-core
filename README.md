# ioc-core
Simple inversion of control core component for NodeJs.

Injects components dependencies and config into other components.

# Installation

    npm install ioc-core

# Usage

## Core boostrap

    var core = require('ioc-core');

    // Config definition
    core.config = {
        // This map contains a list of components to load
        ioc: {
            componentName: "/path/to/ComponentClass.js",
            otherComponent: "/path/to/OtherComponent.js",
            myComponent: "/path/to/MyComponent.js",
        },

        // This config will be available in all components in core.config
        foo: "bar",
        foo2: "bar2"
    };

    // Load one component and its dependencies
    core.load("myComponent").then(function(myComponent) {
        // Here you can use myComponent.
    });

    // Load multiple components
    core.load("myComponent", "otherComponent").spread(function(myComponent, otherComponent) {
        // Here you can use myComponent and otherComponent.
    });

    // ...or using an array :
    core.load(["myComponent", "otherComponent"]).spread(function(myComponent, otherComponent) {
        // Here you can use myComponent and otherComponent.
    });

## Components

Every component should respect one of the following formats :

    function MyComponent(componentName, otherComponent) {
        // Component code
    }
