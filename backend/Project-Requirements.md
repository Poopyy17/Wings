PERN Stack Unli-Wings Restaurant Project Requirements

Project Overview
A contactless ordering system for an unlimited wings restaurant using PostgreSQL, Express, React, and Node.js (PERN stack).

--User Types--

1. Customers
   • Can order food via personal device
2. Cashier/Staff
   • Manage orders and payments
   • Update order status
   • Monitor tables
3. Chef
   • Update menu item availability
4. Admin
   • Access financial reports and analytics
   • View order history

--Technical Requirements--

1. Frontend: React.js
2. Backend: Node.js with Express
3. Database: PostgreSQL
4. Communication: RESTful API

--Database Design Considerations--
• Table sessions to track the entire dining experience
• Order tickets for tracking batches of orders
• Unified item structure for all menu items
• Simplified flavor selection tracking
• Clear separation between Unliwings and regular items
• Analytics integration for tracking popular items
• Streamlined payment process

--Libraries to use--
Frontend (React)
• react-router-dom - For page navigation
• axios - Simple HTTP client for API requests
• tailwindcss - Utility-first CSS framework for easy styling
• lucide-icons - Comprehensive icon library
• sonner - For displaying notifications and alerts
• shadcn - For popup modals (table selection, confirmation screens)

Backend (Node/Express)
• express - Web framework
• pg - PostgreSQL client
• cors - For handling Cross-Origin Resource Sharing
• dotenv - For environment variable management
• nodemon (dev dependency) - For auto-restarting during development
• body-parser - To parse incoming request bodies
• helmet - Basic security enhancement
• date-fns - Lightweight date manipulation (for reports)
• qrcode.react – for qr codes in the table

-- Flow of the App --

1. CUSTOMER FLOWS

1.1 Homepage Access
• User scans table QR code or visits website
• System displays two buttons: "Dine-In" and "Take-Out"

1.2 Dine-In Flow

1. Table Selection
   • User selects/scans table QR
   • System shows modal with:
   • Dropdown for occupants (1-6)
   • Choice: "Unli-Wings" or "Ala Carte"

2. Session Creation
   • System creates a table session with:
   • Selected service type ("Unli-Wings" or "Ala-Carte")
   • Occupancy count
   • For "Unli-Wings": Calculate and store base charge (₱289 × occupants)

3. Menu Presentation
   • If service type is "Unli-Wings":
   • Display flavor selection for unlimited wings
   • Show all other menu items
   • If service type is "Ala-Carte":
   • Hide unlimited wings option
   • Show all items with appropriate flavor limits
   • For wing items, show flavor selection modal with proper limits

4. Order Creation (Ticket/Batch)
   • User adds items to cart
   • For "Unli-Wings" tables:
   • Wing flavor selections are marked as free (is_unliwings=true)
   • All other items are charged normally
   • For "Ala-Carte" tables:
   • All items are charged according to their price

5. Order Submission
   • User reviews cart
   • User clicks "Proceed to Order"
   • System creates an order ticket with status "Pending"
   • All selected items are linked to this ticket

6. Order Management
   • Cashier views pending tickets and accepts/declines
   • User receives notification of acceptance/decline
   • User can place additional orders (create new tickets)

7. Bill Management
   • User views bill with running total of all tickets
   • User can "Order Again" (return to menu)
   • User can "Bill Out" when finished

8. Payment
   • Table session status changes to "For Payment"
   • User proceeds to cashier
   • Cashier processes payment for the entire session
   • Table resets to "Available"

1.3 Take-Out Flow

1. Menu Presentation
   • System shows all items except unlimited wings
   • User can select wing items with appropriate flavor limits
   • User adds items to cart

2. Order Creation
   • User reviews cart
   • User clicks "Proceed to Order"
   • System creates a take-out order with status "Pending"
   • System generates order number
   • All selected items are linked to this order

3. Order Management
   • Cashier views pending take-out orders and accepts/declines
   • User receives notification of acceptance/decline

4. Payment
   • User proceeds to cashier
   • Cashier processes payment
   • Order status changes to "Completed"

5. STAFF FLOWS

2.1 Cashier Flow

1. Authentication
   • User clicks staff login
   • Selects "Cashier" role
   • Enters 6-digit code

2. Table Session Monitoring
   • View all tables with:
   • Status (Available/Occupied/For Payment)
   • Service type (Unli-Wings/Ala-Carte)
   • Occupancy count
   • Session total amount

3. Order Ticket Management
   • View pending order tickets grouped by table session
   • Accept or decline incoming order tickets
   • Mark tickets as "Completed" when served

4. Take-Out Order Management
   • View pending take-out orders
   • Accept or decline take-out orders
   • Mark orders as "Completed" when ready

5. Payment Processing
   • For table sessions with "For Payment" status:
   • View itemized bill showing all tickets in the session
   • Process payment for the entire session
   • Mark session as "Paid"
   • Reset table to "Available"
   • For take-out orders:
   • View order details
   • Process payment
   • Mark order as "Paid"

2.2 Chef Flow

1. Authentication
   • User clicks staff login
   • Selects "Chef" role
   • Enters 6-digit code

2. Inventory Management
   • Toggle availability of menu items
   • Toggle availability of wing flavors
   • Receive notifications when items are running low

2.3 Admin Flow

1. Authentication
   • User clicks staff login
   • Selects "Admin" role
   • Enters 6-digit code

2. Dashboard
   • View sales statistics
   • Revenue by day/week/month
   • Popular items based on order_count
   • Popular flavors based on order_count
   • Generate reports
   • View order history

3. KEY USER INTERFACES

3.1 Customer Pages

1. Homepage (Dine-In/Take-Out selection)
2. Menu Page (Item selection with flavor options)
3. Cart Page (Review and confirm)
4. Bill Page (Running total of all tickets, reorder, bill out)

3.2 Staff Pages

1. Login Page
2. Cashier Dashboard (Table sessions, Order tickets, Take-out orders)
3. Chef Dashboard (Inventory management)
4. Admin Dashboard (Reports and analytics)

--Menu Items--

4. Unliwings - PHP289
   Unliwings flavors:
   • Soy Garlic
   • Honey Garlic
   • Spicy Buffalo
   • Honey Butter
   • Honey Mustard
   • Garlic Parmesan
   • Wings Express Signature
   • Salted Egg
   • Spicy Teriyaki
   • Teriyaki
   • Lemon Glazed
   • Sweet Chili
   • Garlic Butter
   • Spicy BBQ
   • Cheesy Cheese
   • Chili Cheese
   • Salt and Pepper

5. Ala Carte
   • 3pcs of wings (1 flavor) – PHP109
   • 6pcs of wings (2 flavors) – PHP169
   • 12pcs of wings (3 flavors) – PHP299
   • 24pcs of wings (6 flavors) – PHP559
   • 36pcs of wings (9 flavors) – PHP849

6. Rice Meals
   • 3pcs of wings with 1 rice – PHP119
   • 6pcs of wings with 1 rice – PHP179
   • 6pcs of wings with 2 rice – PHP189
   • 12pcs of wings with 2 rice – PHP319
   • 24pcs of wings with 2 rice – PHP619
   • Nuggets with rice – PHP119

7. Nachos
   • Cheesy Nachos – PHP89
   • Overload Nachos – PHP99
   • Overload Nachos Fries – PHP109

8. Fries
   • Cheese – PHP59
   • Sour Cream – PHP59
   • BBQ – PHP59

9. Snacks
   • Chicken Nuggets – PHP99
   • Kikiam – PHP69
   • Lumpiang Shanghai – PHP99

10. Refreshers (Medium – PHP49, Large – PHP59, 1 Liter – PHP79)
    • House Blend Iced Tea
    • Strawberry
    • Lychee
    • Green Apple
    • Blueberry
    • Lemon

11. Extras
    • Rice – PHP15
    • Garlic Mayo Dip – PHP25
    • Cheese Dip – PHP25
    • Plain Mayo – PHP15
    • Ketchup – PHP15

-- Complete User Flow Paths --

1.  Dine-In with Unli-Wings Path
    Customer → Start Order → Dine-In → Table Selection → Occupancy → "Unli-Wings" → Menu → Place Order → Bill/Reorder → Payment → Complete

        Detailed Flow:
            1. Customer clicks "Start Order" button on homepage
            2. Selects "Dine-in" option
            3. Selects/scans table number
            4. Sets occupancy (1-6 people)
            5. Selects "Unli-Wings" service type for the table
                • System creates a table session with service_type="Unliwings"
                • System calculates unliwings_total_charge = ₱289 × occupancy
            6. Navigates to menu page
                • Can select wing flavors for unlimited wings (no additional charge)
                • Can order other menu items (with charge)
            7. Adds items to cart
                • System marks wing flavor selections as is_unliwings=true
            8. Proceeds to order (creates order ticket with status="Pending")
            9. Cashier accepts/declines the order ticket
            10. Customer receives notification of acceptance
            11. Customer can create additional order tickets ("Order Again")
            12. When finished, customer clicks "Bill Out"
            13. Table session status changes to "For Payment"
            14. Pays bill at cashier counter
            15. Cashier marks session as paid
            16. Table resets to "Available"

2.  Dine-In with Ala-Carte Path
    Customer → Start Order → Dine-In → Table Selection → Occupancy → "Ala-Carte" → Menu → Place Order → Bill/Reorder → Payment → Complete

        Detailed Flow:
            1. Customer clicks "Start Order" button on homepage
            2. Selects "Dine-in" option
            3. Selects/scans table number
            4. Sets occupancy (1-6 people)
            5. Selects "Ala-carte" service type for the table
                • System creates a table session with service_type="Ala-carte"
            6. Navigates to menu page
                • Unli-wings option hidden
                • All items charged individually
                • Can select limited flavors for wing orders based on portion size
            7. Adds items to cart
            8. Proceeds to order (creates order ticket with status="Pending")
            9. Cashier accepts/declines the order ticket
            10. Customer receives notification of acceptance
            11. Customer can create additional order tickets ("Order Again")
            12. When finished, customer clicks "Bill Out"
            13. Table session status changes to "For Payment"
            14. Pays bill at cashier counter
            15. Cashier marks session as paid
            16. Table resets to "Available"

3.  Take-out Path
    Customer → Start Order → Take-Out → Menu → Place Order → Payment → Complete

        Detailed Flow:
            1. Customer clicks "Start Order" button on homepage
            2. Selects "Take-out" option
            3. Navigates directly to menu page
                • Unli-wings option hidden
                • All items charged individually
                • Can select limited flavors for wing orders based on portion size
            4. Adds items to cart
            5. Proceeds to order (creates take_out_order with status="Pending")
            6. System generates order number
            7. Cashier accepts/declines the take-out order
            8. Customer receives notification of acceptance
            9. Proceeds to payment at cashier counter
            10. Cashier marks order as paid
            11. Order status changes to "Completed" when ready for pickup

4.  Cashier Flow Path
    Staff → Login → Cashier Dashboard → Table/Order Management → Process Payments → Complete

        Detailed Flow:
            1. Staff member accesses login screen
            2. Selects "Cashier" role and enters passcode
            3. Views dashboard with:
               • Table sessions (status, service type, occupancy, total amount)
               • Pending order tickets
               • Pending take-out orders
            4. Manages incoming orders:
               • Accepts/declines pending order tickets
               • Accepts/declines pending take-out orders
            5. Processes payments:
               • For table sessions with "For Payment" status:
                 - Views itemized bill of all tickets in the session
                 - Processes payment
                 - Marks session as paid
                 - Table automatically resets to "Available"
               • For take-out orders:
                 - Views order details
                 - Processes payment
                 - Marks order as paid

5.  Chef Flow Path
    Chef → Login → Kitchen Dashboard → Inventory Management → Complete

        Detailed Flow:
            1. Chef accesses login screen
            2. Selects "Chef" role and enters passcode
            3. Views inventory management screen
            4. Toggles availability of menu items as needed
            5. Toggles availability of wing flavors as needed

6.  Admin Flow Path
    Admin → Login → Admin Dashboard → Reports → Analytics → Complete

        Detailed Flow:
            1. Admin accesses login screen
            2. Selects "Admin" role and enters passcode
            3. Views admin dashboard with:
               • Revenue statistics (daily, weekly, monthly)
               • Popular menu items (based on order_count)
               • Popular wing flavors (based on order_count)
            4. Generates custom reports
            5. Views detailed order history

-- Pages and Components Needed --

1. Homepage (Dine-In/Take-Out selection)
   • Dialog with two buttons: "Dine-In" and "Take-Out"
   • Dialog with Table Selection
   • Dialog with Occupancy Selection
   • Dialog with Service Type Selection (Unli-Wings/Ala Carte)
2. Menu Page (Item selection)
   • Tabs for menu categories
   • List of menu items with prices
   • Flavor selection for wing items
   • Option to add items to cart
3. Cart Page (Review and confirm)
   • List of items in cart with quantities, flavors, and prices
   • Submit order button
4. Bill Page (Running total, reorder, bill out)
   • Running total of all tickets in the session
   • List of all ordered items grouped by ticket
   • Option to "Order Again" (return to menu)
   • Option to "Bill Out" (finishes ordering)
5. Login Page
   • Selection for role (Cashier, Chef, Admin)
   • Input for authentication code
6. Cashier Dashboard
   • Table monitoring section
   • Order ticket management section
   • Take-out order management section
   • Payment processing section
7. Chef Dashboard
   • Menu item availability toggles
   • Wing flavor availability toggles
8. Admin Dashboard
   • Revenue statistics with charts
   • Popular items/flavors with charts
   • Report generation options
   • Order history browser

Important Notes:

1. Create each route and controller in just 1 file in the routes folder.
2. Use the installed component in the ui folder in the frontend for building components, this is from shadcn.
3. Keep the app simple.
4. The database structure has been redesigned to use a session-based approach for tracking orders.
5. Each order is now a "ticket" in the system, allowing for batch processing of orders.
6. The unified item structure simplifies queries and improves performance.
7. Analytics tracking is built into the database schema for easy reporting.
