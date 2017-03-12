module.exports = {
    "extends": "airbnb",
    "plugins": [
        "react",
        "jsx-a11y",
        "import"
    ],
    "globals": {
        "window": true,
        "document": true,
        "Peer": true,
        "io": true,
        "mariasql": true
    },
    "rules": {
        'no-console': 0,
    }
};