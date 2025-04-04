# Inference MD - Design Guidelines

## Color Palette

### Primary Colors
- **Deep Medical Blue (#2964AB)**: Main brand color, used for primary buttons, active states, and key UI elements
- **Calm Teal (#218F8D)**: Secondary accent, used for highlights and secondary actions
- **Hospital White (#FAFCFD)**: Background color, creates a clean clinical feel

### Supporting Colors
- **Success Green (#31B77A)**: For confirmations, approvals, and positive states
- **Alert Amber (#F59E0B)**: For warnings and cautions
- **Error Red (#E63946)**: For errors and critical messages
- **Neutral Gray (#8C9BAB)**: For secondary text and inactive states
- **Dark Text (#1A2A40)**: For primary text, ensures readability with AA+ accessibility

### Color Usage Guidelines
- Maintain high contrast ratios (minimum 4.5:1) for all text elements
- Use color consistently to indicate meaning (status, action, etc.)
- Include secondary indicators (icons, text) and never rely on color alone
- Reserve bright colors for small accent areas and calls to action

## Typography

### Font Family
**Primary Font**: Inter - A clean, highly legible sans-serif font designed for screens
- **Regular (400)**: For body text and general content
- **Medium (500)**: For subheadings and emphasis
- **Semibold (600)**: For headings and important UI elements

### Font Sizing
- **Body Text**: 16px (1rem) - Ensures readability on various devices
- **Secondary Text**: 14px (0.875rem) - For less critical information
- **Headings**:
  - H1: 24px (1.5rem)
  - H2: 20px (1.25rem)
  - H3: 18px (1.125rem)
- **Button Text**: 16px (1rem)
- **Small UI Elements**: 12px (0.75rem) - Use sparingly

### Line Height
- **Body Text**: 1.5 - Provides adequate spacing for medical terminology
- **Headings**: 1.2 - Tighter for visual hierarchy

## Layout Structure

### Three-Panel Interface

#### Left Panel (250px width)
- **Purpose**: Conversation history and case management
- **Background**: Light gray (#F5F7F9) to visually separate from main content
- **Contents**:
  - "Start New Case" button (prominent, at top)
  - List of previous cases (scrollable)
  - Case filtering and search options

#### Central Main Panel (fluid, ~60% of viewport)
- **Purpose**: Primary interaction area
- **Background**: White (#FAFCFD)
- **Contents**:
  - PHI disclaimer (collapsible once acknowledged)
  - Chat interaction area
  - Message bubbles (visually distinct for AI vs doctor)
  - Input area with expandable text field
  - Stage-specific action buttons

#### Right Panel (350px width)
- **Purpose**: Interactive reasoning trace
- **Background**: Very light blue (#F0F7FF)
- **Contents**:
  - Reasoning stages (collapsible sections)
  - Color-coded reasoning types
  - Expandable details
  - Download/export options

### Stage Progress Indicator
- **Location**: Horizontal bar below header
- **Style**: Linear progress bar with labeled nodes
- **States**:
  1. Completed (green checkmark icon)
  2. Active (blue highlight, slightly enlarged)
  3. Upcoming (light gray, smaller)
- **Labels**: Short, clear stage names
  1. Patient Info
  2. Diagnosis
  3. Treatment
  4. Generate Note

## UI Components

### Buttons

#### Primary Action Buttons
- **Style**: Solid blue (#2964AB), rounded corners (8px)
- **States**:
  - Default: Blue with white text
  - Hover: Slightly darker blue
  - Active: Darker blue with slight inset shadow
  - Disabled: Gray with reduced opacity
- **Examples**: "Approve Diagnosis", "Generate Note"

#### Secondary Action Buttons
- **Style**: White with blue border and text
- **Examples**: "Modify Treatment", "Ask Question"

#### Tertiary Actions
- **Style**: Text-only with blue color, underline on hover
- **Examples**: "View Details", "Collapse"

#### Approval/Rejection Buttons
- **Approve**: Green (#31B77A) with checkmark icon
- **Require Changes/Reject**: White with amber border and text

### Input Fields
- **Style**: White background, light gray border (1px)
- **Focus State**: Blue border with subtle box shadow
- **Validation**: Red border and error message for invalid inputs
- **Help Text**: Small gray text below field

### Chat Messages
- **AI Messages**:
  - Light blue background (#F0F7FF)
  - Left-aligned
  - Includes small AI icon
  - Timestamp
  
- **Doctor Messages**:
  - White background with blue border
  - Right-aligned
  - Timestamp

### PHI Disclaimer Box
- **Style**: Yellow background (#FEF9C3) with amber border
- **Icon**: Warning icon
- **Text**: Clear, concise warning about PHI
- **Action**: Checkbox to acknowledge understanding

### Stage Completion Indicators
- **Style**: Checkmark animation when stage completes
- **Transition**: Smooth scroll to next stage

### Reasoning Trace Elements
- **Section Headers**: Collapsible, with expand/collapse icon
- **Content**: Structured with clear hierarchy
- **Highlighting**: Important findings in blue
- **Causal Relationships**: Visual indicators (arrows, connecting lines)

## Responsive Design
- **Desktop Focus**: Optimized for desktop/laptop screens (1280px+)
- **Tablet Adaptation**: Collapsible panels with toggle controls
- **Panel Priority**: On smaller screens, main panel takes precedence

## Accessibility Guidelines
- **Keyboard Navigation**: Full keyboard accessibility with visible focus states
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Blindness**: All information conveyed by color also has text/icon indicators
- **Text Scaling**: Interface remains usable when text is enlarged up to 200%
- **Reduced Motion**: Alternative transitions for users who prefer reduced motion

## Interaction Patterns

### Stage Transitions
- **Automatic**: System detects when sufficient information exists to proceed
- **Manual Override**: Doctors can force progression when needed
- **Visual Cue**: Subtle animation indicating readiness to proceed

### Error Handling
- **Inline Validation**: Immediate feedback on input errors
- **System Errors**: Non-intrusive notifications with clear recovery paths
- **Missing Information**: Highlighted fields with explanation of what's needed

### Scrolling Behavior
- **Auto-scroll**: New messages and stage transitions trigger automatic scrolling
- **Manual Override**: Scroll pauses when user manually scrolls
- **Scroll Indicators**: Subtle indicators when content extends beyond visible area

## Loading States
- **Initial Load**: Simple, branded loading screen (max 2 seconds)
- **Processing Actions**: Small spinner in affected UI area only
- **AI Processing**: Typing indicator for natural conversation feel

## Iconography
- **Style**: Simple, outlined icons with consistent 2px stroke weight
- **Size**: 24px for main interface, 16px for secondary elements
- **Purpose**: Used to enhance recognition, not replace text

## Notes For Implementation
- Prioritize performance and response time above visual complexity
- Ensure all interactive elements have a minimum touch target of 44x44px
- Test with actual healthcare professionals in realistic settings
- Implement gradual feature reveal for new users
