# react-native-smart-capture

[![npm version](https://img.shields.io/npm/v/react-native-smart-capture.svg)](https://www.npmjs.com/package/react-native-smart-capture)
[![license](https://img.shields.io/npm/l/react-native-smart-capture.svg)](https://github.com/SwiftCrew/react-native-smart-capture/blob/main/LICENSE)
[![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg)](https://reactnative.dev/)
[![CI](https://github.com/SwiftCrew/react-native-smart-capture/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftCrew/react-native-smart-capture/actions/workflows/ci.yml)

> **Camera + Gallery + Crop — one SDK, zero hassle.**

A production-ready React Native SDK for capturing and selecting profile images with interactive crop preview and built-in permission helpers.

<p align="center">
  <img src="https://raw.githubusercontent.com/SwiftCrew/react-native-smart-capture/main/react-native-smart-capture.gif" width="300" alt="Demo" />
</p>

---

## Why Use This SDK?

Building a profile image picker from scratch requires handling:

- Camera permissions (iOS + Android differences)
- Photo library permissions (iOS limited access, Android scoped storage)
- Camera integration with front/back switching and zoom
- Gallery image selection
- Image cropping with gesture support
- Memory management and cleanup
- Modal presentation issues on iOS

**This SDK handles all of that** with a clean, customizable API.

---

## Features

| Feature | Description |
|---------|-------------|
| **Camera Capture** | Front/back camera with 1x/2x zoom toggle |
| **Gallery Selection** | Native picker with iOS limited access support |
| **Interactive Crop** | Pan & pinch gestures, circle or rectangle shapes |
| **Permission Helpers** | Check, request, and deep-link to settings |
| **Customizable UI** | Override strings, colors, and fonts |
| **Cross-Platform** | iOS and Android support |
| **Memory Safe** | Proper cleanup and mounted refs |
| **TypeScript** | Full type definitions included |

---

## Installation

```bash
# Using yarn
yarn add react-native-smart-capture

# Using npm
npm install react-native-smart-capture


## Example App

A complete example app is included in the `example/` directory.

```bash
# Clone the repo
git clone https://github.com/SwiftCrew/react-native-smart-capture.git
cd react-native-smart-capture

# Install dependencies
yarn install
cd example && yarn install

# iOS
cd ios && pod install && cd ..
yarn ios

# Android
yarn android
```

---

## Use Cases

- 👤 User profile photo upload
- 🎭 Avatar selection in social apps
- 🪪 KYC/identity verification
- 📝 Document photo capture
- 🛒 Product image upload

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

---

## License

```bash
curl -sSL https://choosealicense.com/licenses/mit/ -o /dev/null
# or quicker:
cat > LICENSE <<'EOF'
MIT License

Copyright (c) 2026 SwiftCrew

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

---

## Support

- 🐛 [Report a bug](https://github.com/SwiftCrew/react-native-smart-capture/issues)
- 💡 [Request a feature](https://github.com/SwiftCrew/react-native-smart-capture/issues)
- ⭐ Star the repo if you find it useful!
