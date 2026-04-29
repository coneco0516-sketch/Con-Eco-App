# Vendor-Specific Bulk Pricing Updater

This plan outlines the steps to build a specialized tool inside your Admin panel that allows you to select a specific vendor, view all their products in a single table, and rapidly update prices in bulk without opening individual product pages.

## Goal
To eliminate the "Founder Bottleneck" by building a highly efficient data-entry interface (similar to an Excel spreadsheet) that allows a solo admin to update a vendor's prices based on daily WhatsApp messages in under 2 minutes.

## Approved Decisions (Based on your feedback)

1. **Table Filtering:** When a vendor is selected, the table will display **all** of their products at once without requiring secondary category filters.
2. **"Last Updated" Tracker:** We will add a "Last Updated" indicator next to each product to help track daily progress.
3. **Save Mechanism:** We will implement a **Single Row Save** approach, so you can save each product's price individually without relying on a bulk save button.

## Proposed Changes

### Frontend (React Admin Panel)
We will add a new dedicated route and component to your Admin dashboard.

#### [NEW] `Frontend/src/pages/admin/VendorBulkPriceUpdater.jsx`
- **Vendor Selector:** A searchable dropdown to select the target vendor.
- **Data Grid (Table):** A fast-rendering table component that displays all products for that vendor.
  - Columns: Product Name, Brand, Category, Current Price, **Last Updated Time**, and **New Price Input**.
- **Action Mechanism:** A "Save" button or `onBlur` autosave per row so you can instantly save an individual item's price.

### Backend (Node.js/Express API)
#### [MODIFY] `Backend/routes/adminRoutes.js`
- Add `GET /api/admin/vendors/:vendorId/products` (Fetches all products linked to that vendor ID).
- Add `PUT /api/admin/products/:productId/price` (Accepts an individual price update for the single-row save mechanism).

#### [MODIFY] `Backend/controllers/adminController.js`
- Create the controller function to validate the incoming array of price changes.
- Ensure the user making the request has Admin privileges.

### Database (Neon Postgres)
Since Neon is Serverless Postgres, we want to minimize the number of queries we make to save on connection time and compute.

#### [MODIFY] `Backend/models/ProductModel.js` (or raw queries depending on setup)
- Instead of running a `for` loop that does 50 separate `UPDATE` queries, we will use a **Postgres Transaction** or an `UPDATE ... FROM (VALUES ...)` query. 
- This ensures that updating 100 prices happens in exactly 1 fast database trip, and if one fails, they all roll back safely so you don't get partial, corrupted data.

## Verification Plan

### Automated Tests
- Test the `PUT /api/admin/bulk-update-prices` endpoint using Postman/Insomnia with an array of 50 mocked product updates to ensure it processes under 500ms.

### Manual Verification
1. Open the new Admin page.
2. Select "Test Vendor".
3. Use the `Tab` key to quickly type new prices for 5 items.
4. Click "Save All".
5. Refresh the page to verify the new prices persisted to the database and no accidental data overrides occurred.
