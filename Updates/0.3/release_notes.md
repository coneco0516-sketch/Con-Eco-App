# Con-Eco Update v0.3 Release Notes

1. About Us page ✅
 -> Added Project Head photo to About Us page. ✅

2. Contact Us Page ✅
 -> Integrated the contact form with the backend to send messages directly to the admin email: [coneco0516@gmail.com]. ✅
 -> Added full form validation, interactive loading states, and success notifications for better UX. ✅
 -> Created a dedicated POST endpoint in the FastAPI backend for secure message handling. ✅
 -> the contact message after sending to admin email should also be stored in the database and should be visible in the admin dashboard and the resonse would be given to the user in the form of a official email as same as email verification notification like that. ✅
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

5. In pay later feature i need this pay later should has 3 stages:
Total Time in pay later option to pay is: 41 days.
 -> 1st stage: after delivered customer gets 30 days time to pay for the product/service. 
 -> 2nd stage: after 30 days of time if fails to pay then they get 10 days extra due date. and if still fails to pay :
 -> 3rd stage: then the user will be blocked from using pay later feature for next 3 months with warning email on 11th day of 3rd stage to pay the due amount on that specific day of 3rd stage. he sould pay on that day only, any condition.


6. Credit score system for user: total score will be 100 points before using the feature .
 -> with this credit points if he go on paying payment in 1st stage from his first order then credit score will be maintained 100.
-> if he fails to pay in 1st stage and pays in 2nd stage then his credit score will be reduced by 10 points.
-> if he fails to pay in 1st and 2nd stage and pays in 3rd stage then his credit score will be reduced by 20 points.
-> if he fails to pay in 1st and 2nd and 3rd stage then his credit score will be reduced by 30 points and he will be blocked from using pay later feature for next 3 months.
-> in 11th day of 3rd stage he must pay due amount.

as above that credit system but what about customer in last order he deducted his credit score due to not paying in 1st stage but he paid in 2nd stage so his credit score is reduced by 10 points. now he placed a new order and paid in 1st stage so his credit score should be increased by half of deducted points or if again he pays in second stage then the above format will continue. and if in last order he fails to pay in 1st and 2nd stage and pays in 3rd stage then his credit score will be reduced by 20 points as per above and in present order after doing this in previous order if he pays in 1st stage then his credit score should be increased by half of deducted points or if again he pays in third stage then the above format will continue. but in place of 20 points it should reduce 30ponits on paying in 3rd stage for 2 orders. 

8. Production Deployment ✅
 -> Compiled the frontend into an optimized production bundle using Vite. ✅
 -> Deployed to Railway via GitHub (Commit: `f3d5e46`). ✅


---
*End of v0.3 Documentation.*