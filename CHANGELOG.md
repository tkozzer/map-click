# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-08

### Added
- Isolation mode for selecting specific regions
- Modal for selecting regions
- Predefined region selection buttons

### Changed
- Disabled county mode in isolation mode
- Modified isolation modal behavior

### Removed
- Disabled export JSON functionality
- Disabled custom context menus for states and counties

### Fixed
- Map key display in isolation state mode
- Image preview in isolation mode
- Isolation mode state handling
- Isolation apply button functionality
- Reset and recenter buttons in isolation mode
- Modal selection behavior

## [1.0.0] - 2024-12-03

### Added
- Multi-color functionality for state mode
- Map key for each mode (county/state)
- Custom toggle switch for county and state modes
- Export image functionality with preview
- Export JSON functionality with selection options
- Custom alerts for export features
- Feature design documentation
- Beta tag
- Environment-based logging
- Rate limit constraints for data fetching

### Changed
- Switched to Vite for build system
- Moved multi-color toggle to left bottom corner
- Updated color picker to allow for hex colors
- Improved map context menus and tooltips
- Positioned keymap on export images
- Modified build scripts and configuration
- Removed debug toolbar for production

### Fixed
- Export image mode and multi-color switching
- Context menus for export functionality
- State selection and clearing/reset functionality
- Preview image display and label positioning
- Louisiana parish display issue
- Map key width calculation
- Zoom controls
- Environment mode variables
- Hotkey sticking issues
- Build and logging issues

### Added Data
- OSM URL integration
- WikiData integration
- State context menu data enhancement