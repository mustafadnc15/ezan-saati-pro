const { withPodfile } = require('@expo/config-plugins');

const withGoogleMaps = (config) => {
    return withPodfile(config, (config) => {
        const podfile = config.modResults.contents;
        const targetPod = "pod 'react-native-google-maps', :path => node_modules_path + '/react-native-maps'";

        // Check if valid to add
        if (podfile.includes(targetPod)) {
            return config;
        }

        // Anchors to inject after. Try to match standard Expo or RN anchors.
        // "use_expo_modules!" is common in Expo managed projects.
        const anchor = "use_expo_modules!";

        const googleMapsPods = `
  # Google Maps 
  pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
  pod 'GoogleMaps'
  pod 'Google-Maps-iOS-Utils'
`;

        if (podfile.includes(anchor)) {
            config.modResults.contents = podfile.replace(
                anchor,
                `${anchor}${googleMapsPods}`
            );
        } else {
            // Fallback: append, though likely anchor exists
            config.modResults.contents += googleMapsPods;
        }

        return config;
    });
};

module.exports = withGoogleMaps;
