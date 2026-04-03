## Plan: Product Label Scanner & Review Tool

### Pages to create/modify:
1. **Landing Page** (`/`) - Hero with "Scan your product label" headline + Upload CTA
2. **Upload Page** (`/scan`) - Image/PDF upload with drag-drop, camera option
3. **Scanning/Processing Page** (`/scan/processing`) - Animated loader "Analysing your label…"
4. **Results Page** (`/scan/results`) - Summary, detected fields, needs-review items, actions

### Key Components:
- `LabelUploader` - Drag-drop zone for JPG/PNG/PDF
- `ScanningAnimation` - Progress indicator with messaging
- `ResultsSummary` - "X of Y fields found, Z need attention"
- `DetectedFieldsList` - Extracted fields with ✅/⚠️ status
- `CategoryDetector` - Auto-detected category with manual override
- `ActionsSection` - Generate compliant version, Download report, Book call

### Architecture:
- Use a session store (React context or zustand) to pass scan data between steps
- Mock OCR results with realistic data for demo
- Keep existing PDF report generation
- Simplify sidebar/navigation to match scan flow

### Pages to remove/repurpose:
- Remove: ComplianceDashboard, RulesEngineDashboard, ProductDashboard, LabelDataDashboard
- Simplify sidebar to: Home, Scan, About

### Styling:
- Clean, modern, minimal steps
- Clear scan → results → actions flow
- Disclaimer at bottom of results
