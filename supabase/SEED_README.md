# Test Users Documentation

This document contains information about the test users created by the seed script.

## Running the Seed

```bash
# Reset database and apply seed
supabase db reset

# Or manually run the seed
psql -h localhost -p 54322 -U postgres -d postgres < supabase/seed.sql
```

## Test Accounts

All test accounts use the password: **`password123`**

### Admin Account
- **Email**: `admin@test.nextstock.com`
- **Password**: `password123`
- **Role**: Admin
- **Store**: All stores (full access)
- **Permissions**: Full system access, can manage all stores, users, and products

### Manager Accounts

#### Manager 1 - Downtown
- **Email**: `manager1@test.nextstock.com`
- **Password**: `password123`
- **Role**: Manager
- **Store**: Downtown Store
- **Permissions**: Can manage products and inventory for Downtown Store only

#### Manager 2 - Uptown
- **Email**: `manager2@test.nextstock.com`
- **Password**: `password123`
- **Role**: Manager
- **Store**: Uptown Store
- **Permissions**: Can manage products and inventory for Uptown Store only

### Cashier Accounts

#### Cashier 1 - Downtown
- **Email**: `cashier1@test.nextstock.com`
- **Password**: `password123`
- **Role**: Cashier
- **Store**: Downtown Store
- **Permissions**: Can view products and process sales for Downtown Store

#### Cashier 2 - Uptown
- **Email**: `cashier2@test.nextstock.com`
- **Password**: `password123`
- **Role**: Cashier
- **Store**: Uptown Store
- **Permissions**: Can view products and process sales for Uptown Store

#### Cashier 3 - Brooklyn
- **Email**: `cashier3@test.nextstock.com`
- **Password**: `password123`
- **Role**: Cashier
- **Store**: Brooklyn Store
- **Permissions**: Can view products and process sales for Brooklyn Store

## Test Stores

1. **Downtown Store**
   - Address: 123 Main Street, New York, NY 10001
   - Phone: +1-555-0101
   - Email: downtown@nextstock.com

2. **Uptown Store**
   - Address: 456 Park Avenue, New York, NY 10022
   - Phone: +1-555-0102
   - Email: uptown@nextstock.com

3. **Brooklyn Store**
   - Address: 789 Atlantic Avenue, Brooklyn, NY 11217
   - Phone: +1-555-0103
   - Email: brooklyn@nextstock.com

## Sample Products

The seed creates 9 sample products distributed across the three stores:

### Downtown Store Products (3)
- Wireless Mouse (ELEC-001) - $29.99
- USB-C Cable (ELEC-002) - $12.99
- Cotton T-Shirt (CLOTH-001) - $19.99

### Uptown Store Products (3)
- JavaScript Guide (BOOK-001) - $39.99
- Yoga Mat (SPORT-001) - $34.99
- Vitamin C Supplement (HEALTH-001) - $15.99

### Brooklyn Store Products (3)
- Organic Coffee Beans (FOOD-001) - $24.99
- Ceramic Plant Pot (HOME-001) - $18.99
- Building Blocks Set (TOY-001) - $29.99

## Testing Scenarios

### Admin Access Test
1. Login as `admin@test.nextstock.com`
2. Navigate to Stores - should see all 3 stores
3. Navigate to Products - should see all 9 products from all stores
4. Can create products in any store

### Manager Access Test
1. Login as `manager1@test.nextstock.com`
2. Navigate to Products - should only see Downtown Store products (3 items)
3. Try to create a product - can only assign to Downtown Store
4. Cannot access Stores management page

### Cashier Access Test
1. Login as `cashier1@test.nextstock.com`
2. Should only have access to Dashboard and POS
3. Cannot access Products, Stores, or Reports pages
4. Can view products in their assigned store via POS

## Security Notes

- These credentials are **FOR DEVELOPMENT ONLY**
- Never use these accounts or passwords in production
- The password hash in seed.sql is intentionally weak for development
- In production, use proper authentication via Supabase Auth API
