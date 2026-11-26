# ERP & Manufacturing Operations SOP

**TOLAND (toland.pvt.ltd)** — Industrial Apparel Manufacturing Facility  
*Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)*

---

## 1. Overview of Factory Operations

The TOLAND manufacturing plant produces high-grade denim jeans, twill trousers, and casual cotton shirts. The integrated ERP module tracks materials from raw cotton roll procurement to packed garment dispatch.

---

## 2. Supplier Management & Raw Material Procurement

### Approved Suppliers
- Raw denim fabrics: Surat and Ahmedabad textile mills.
- Metal hardware (rivets, buttons, zips): Certified fastener producers.
- Packaging & labels: Eco-friendly packaging vendors.

### Raw Material Master Categories
1. **Fabrics (Meters)**:
   - 13.5 oz Raw Rigid Indigo Denim
   - 12.0 oz Comfort Stretch Selvedge Denim
   - 10.5 oz Cotton Twill Chino Fabric
2. **Hardware & Trims (Units)**:
   - Antique Brass Shank Buttons (17mm)
   - Embossed Copper Rivets (9mm)
   - YKK Brass Heavy-Duty Zippers (5-inch)
3. **Packaging Materials (Units)**:
   - Recycled Kraft Paper Hangtags
   - Embossed Genuine Leather Back Patches
   - Biodegradable Protective Polybags

---

## 3. Bill of Materials (BOM) & Recipe Formulation

Each manufactured SKU requires an authorized BOM configuration in `/admin/erp/boms`.

### Standard Denim Jeans BOM (Example)
| Component | Material Name | Standard Consumption | Unit | Scrap Allowance |
|---|---|---|---|---|
| Main Fabric | 13.5 oz Raw Rigid Indigo Denim | 1.45 | Meters | 3.5% |
| Pocketing | Bleached Cotton Pocket Lining | 0.25 | Meters | 2.0% |
| Waist Fastener | Antique Brass Shank Button | 1.00 | Piece | 0.5% |
| Stress Reinforcements | Copper Rivets | 5.00 | Pieces | 1.0% |
| Fly Fastener | YKK Brass Zipper 5" | 1.00 | Piece | 0.0% |
| Branding | Genuine Leather Waist Patch | 1.00 | Piece | 0.0% |
| Packaging | Bio-degradable Polybag | 1.00 | Piece | 0.0% |

### Bottleneck & Capacity Engine
The capacity calculator scans current real-time inventory levels against the BOM formula:
$$\text{Max Capacity} = \min_{i \in \text{BOM}} \left\lfloor \frac{\text{Stock Quantity}_i}{\text{Consumption Per Unit}_i} \right\rfloor$$
The material yielding the lowest capacity is flagged as the **Production Bottleneck**.

---

## 4. 5-Stage Production Workflow

```
[STAGE 1: Cutting] ──> [STAGE 2: Stitching] ──> [STAGE 3: Washing] ──> [STAGE 4: Finishing] ──> [STAGE 5: Packing]
  Roll inspection       Front/back assembly    Enzyme stone wash      Thread trimming       Final fold & tag
  Laser pattern cut     Pocket insertion       Whisker scraping       Button/rivet press    Barcode scan
  Bundle tagging        Waistband attachment   Ozone softening        QC table inspection   Polybags & cartons
```

### Stage Quality Checks & Yield Formula
- **Cutting Yield**: Targets $\ge 98\%$. Scrap denim is collected for recycled acoustic insulation.
- **Stitching Quality**: Inspection for seam integrity, stitch density (8–10 stitches per inch), and needle holes.
- **Washing Cycle**: Standardize water temperature, stone abrasive load, and pH neutralizers.
- **Finishing & Pressing**: Industrial steam pressing at $160^\circ\text{C}$ to lock shrinkage.
- **Packing**: Final barcoded polybagging and master carton packing (50 units/carton).

---

## 5. Warehouse Receiving & Stock Ledger SOP

1. **Purchase Order Creation**: Generated in `/admin/erp/purchase-orders` with agreed rate and delivery date.
2. **Gate Entry & GRN**: Physical delivery verified against invoice in Barbigha warehouse.
3. **Quality Inspection**: 10% sampling of fabric rolls for GSM, shrinkage, and dye shade consistency.
4. **Stock Ledger Entry**: Real-time increment in inventory balance. Every transaction creates an immutable ledger row (`purchase_received`, `production_consume`, `production_yield`, or `damaged_writeoff`).

---

## 6. B2B Wholesale Tiers & Volume Matrix

To serve national distributors and multi-brand outlets (MBOs), tiered wholesale price breaks apply automatically:

| Tier | Minimum Order Qty (MOQ) | Discount off Retail MRP | Payment Terms | Credit Limit |
|---|---|---|---|---|
| **Retailer Tier 1** | 20 Pieces | 35% | 100% Advance / COD | ₹50,000 |
| **Wholesaler Tier 2** | 100 Pieces | 48% | 50% Advance, 50% on Dispatch | ₹2,50,000 |
| **Distributor Tier 3** | 500 Pieces | 58% | 30 Days Net Banking | ₹10,00,000 |
| **Institutional Tier 4** | 2,000+ Pieces | 65% | LC / PDC Against Bank Guarantee | ₹50,00,000 |
