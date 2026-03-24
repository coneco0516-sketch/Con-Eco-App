# Con-Eco Update v0.3 Release Notes

1. About Us page ✅
 -> Added Project Head photo to About Us page. ✅

2. Contact Us Page ✅
 -> Integrated the contact form with the backend to send messages directly to the admin email: [coneco0516@gmail.com]. ✅
 -> Added full form validation, interactive loading states, and success notifications for better UX. ✅
 -> Created a dedicated POST endpoint in the FastAPI backend for secure message handling. ✅
 -> Contact messages are now stored in the `contactmessages` database table for persistent record-keeping. ✅
 -> Users receive an official ConEco acknowledgment email upon submission (same branded style as email verification). ✅
 -> Admin can view, filter (Unread/Read/Replied), and reply to all contact messages from the Admin Dashboard. ✅
 -> Admin replies are sent as official branded ConEco support emails to the user. ✅
 -> New admin page: `/admin/contact-messages` with full message management UI. ✅

3. Nav Bar Logo (Main Flow & Active Session) ✅
 -> The company logo (`Logo.svg`) is now integrated into the header/navbar brand section alongside the "ConEco" name. ✅
 -> Updated Navbar styles in `index.css` to use modern flex alignment and a subtle brand glow. ✅
 -> Logo is now correctly served from the production assets across both guest and logged-in views. ✅

4. Catalogue Page ✅
 -> Add the Feature to edit the product/Services so that it can be edited after adding also if any changes needed. ✅
 -> Added ✏️ Edit button on each catalogue item card to modify name, description, price, unit, and image. ✅
 -> Item type (Product/Service) is locked during editing to prevent data inconsistency. ✅
 -> Added 🗑️ Delete button with a confirmation dialog to prevent accidental deletions. ✅
 -> Created `PUT /api/vendor/catalogue` backend endpoint for secure item updates. ✅
 -> Shared modal for both Add and Edit with contextual button labels. ✅

5. Pay Later 3-Stage Lifecycle (41 Days) ✅
 -> Implemented automated lifecycle: Stage 1 (30 days), Stage 2 (+10 days grace), Stage 3 (Final 24h). ✅
 -> Automated background checks (via `/api/payment/check_overdue`) for transitions and penalties. ✅
 -> Automated email warnings for Stage 2 (Grace) and Stage 3 (Final Deadline). ✅
 -> Automated 3-month account suspension and -30 point penalty for defaulted payments. ✅

6. Dynamic Credit Scoring System ✅
 -> Default 100-point credit system with automatic deductions based on payment stage. ✅
 -> Penalties: Stage 2 (-10), Stage 3 (-20), Default (-30). ✅
 -> Recovery mechanism: Paying in Stage 1 restores half of the points deducted in previous orders. ✅
 -> Escalated penalties: Consecutive Stage 3 payments trigger a -30 point deduction. ✅

7. Multi-Role Visibility & Dashboards ✅
 -> Customer: Real-time credit score and Pay Later eligibility/block status added to Dashboard and Profile. ✅
 -> Vendor: Customer Reliability tracking in Order List – Vendors see customer's credit score before approving orders. ✅
 -> Admin: Full Pay Later lifecycle monitoring – All order stages and due dates visible in the master order list. ✅
 -> Integrated stage-specific badges (Grace/Final Day) across all dashboard views. ✅

8. Production Deployment ✅
 -> Compiled the frontend into an optimized production bundle using Vite. ✅
 -> Deployed to Railway via GitHub (Latest Build Hash: `bc972a0`). ✅

9. Category Based Filtering ✅
 -> Added the feature to filter the products/Services based on the category. ✅
 -> Added the feature to auto-categorize the products/Services based on the category. ✅

---
*End of v0.3 Documentation.*