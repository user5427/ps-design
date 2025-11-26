# MUI Theme Standards (Essential Reference)

## Aspect Ratio
9:16 for mobile only

## Spacing
- **Base unit**: 8px (`theme.spacing(1)`)
- **Common values**: 0.5 (4px), 1 (8px), 2 (16px), 3 (24px), 4 (32px), 6 (48px)
- **Component padding**: Cards/Dialogs use 2-3, Containers use 2-3

## Typography
```javascript
h1: '2.5rem/700', h2: '2rem/700', h3: '1.75rem/600'
h4: '1.5rem/600', h5: '1.25rem/600', h6: '1.125rem/600'
body1: '1rem/400', body2: '0.875rem/400'
button: '0.875rem/500', caption: '0.75rem/400'
```
- **Font weights**: 300 (light), 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Line height**: Headers 1.2-1.5, Body 1.5-1.75

## Colors
```javascript
primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' }
secondary: { main: '#9c27b0', light: '#ba68c8', dark: '#7b1fa2' }
error: { main: '#d32f2f' }, warning: { main: '#ed6c02' }
info: { main: '#0288d1' }, success: { main: '#2e7d32' }
```
- **Text opacity**: primary (0.87), secondary (0.6), disabled (0.38)
- **Dark mode background**: default '#121212', paper '#1e1e1e'

## Border Radius
- **Default**: 4px (subtle) or 8px (modern)
- **Cards**: 8-12px, **Buttons**: 4-8px, **Chips**: 16px (pill)

## Shadows (Elevation)
- **0**: None, **1**: Subtle cards, **2**: Raised buttons, **4**: App bar
- **8**: Dialogs/drawers, **16**: Navigation drawer

## Breakpoints
- **xs**: 0px, **sm**: 600px, **md**: 960px, **lg**: 1280px, **xl**: 1920px

## Common Overrides
```javascript
MuiButton: { textTransform: 'none', padding: '8px 16px' }
MuiCard: { borderRadius: 12 }
MuiTextField: { variant: 'outlined' }
```