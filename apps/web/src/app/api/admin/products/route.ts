import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('products');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || ''; // 'active' | 'inactive' | 'all'

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, products: products || [] });
  } catch (err: any) {
    console.error('[Admin Products GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('products');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      name,
      slug,
      description,
      category_id,
      base_price,
      mrp,
      gst_percent = 12,
      hsn_code = '620342',
      is_active = true,
      is_featured = false,
      meta_title,
      meta_description,
      variants = [],
      images = [],
    } = body;

    if (!name || !slug || !base_price) {
      return NextResponse.json(
        { error: 'Name, slug, and base price are required' },
        { status: 400 }
      );
    }

    // 1. Insert product
    const { data: product, error: productError } = (await (supabase.from('products') as any)
      .insert({
        name,
        slug,
        description: description || null,
        category_id: category_id || null,
        base_price: Number(base_price),
        mrp: mrp ? Number(mrp) : Number(base_price),
        gst_percent: Number(gst_percent),
        hsn_code: hsn_code || '620342',
        is_active: Boolean(is_active),
        is_featured: Boolean(is_featured),
        meta_title: meta_title || null,
        meta_description: meta_description || null,
      })
      .select('*')
      .single()) as any;

    if (productError || !product) {
      throw productError || new Error('Failed to create product');
    }

    const productId = product.id;

    // 2. Insert variants
    if (variants && variants.length > 0) {
      const variantRows = variants.map((v: any, index: number) => ({
        product_id: productId,
        sku: v.sku || `${slug.toUpperCase()}-${v.size || index}`,
        size: v.size || '32',
        fit: v.fit || 'Regular',
        color: v.color || 'Indigo',
        wash: v.wash || 'Raw',
        price: v.price ? Number(v.price) : Number(base_price),
        stock_qty: Number(v.stock_qty || 0),
        barcode: v.barcode || null,
      }));

      await supabase.from('product_variants').insert(variantRows as any);
    }

    // 3. Insert images
    if (images && images.length > 0) {
      const imageRows = images.map((img: any, index: number) => ({
        product_id: productId,
        path: typeof img === 'string' ? img : img.path,
        sort: typeof img.sort === 'number' ? img.sort : index,
      }));

      await supabase.from('product_images').insert(imageRows as any);
    }

    // Storefront cache revalidation
    try {
      revalidatePath('/products');
      revalidatePath('/');
      if (product.slug) {
        revalidatePath(`/products/${product.slug}`);
      }
    } catch (e) {
      console.warn('[Revalidate Warning]:', e);
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('[Admin Products POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('products');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      id,
      action,
      name,
      slug,
      description,
      category_id,
      base_price,
      mrp,
      gst_percent,
      hsn_code,
      is_active,
      is_featured,
      meta_title,
      meta_description,
      variants,
      images,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    // Quick toggle active / 1-click publish
    if (action === 'toggle_active' || (is_active !== undefined && !name && !base_price)) {
      const { data: toggled, error: toggleErr } = (await (supabase.from('products') as any)
        .update({
          is_active: Boolean(is_active),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()) as any;

      if (toggleErr) throw toggleErr;

      try {
        revalidatePath('/products');
        revalidatePath('/');
        if (toggled?.slug) {
          revalidatePath(`/products/${toggled.slug}`);
        }
      } catch (e) {
        console.warn('[Revalidate Warning]:', e);
      }

      return NextResponse.json({
        success: true,
        product: toggled,
        message: toggled.is_active ? 'Product published to Storefront' : 'Product moved to Draft',
      });
    }

    // 1. Update product base record
    const { data: updatedProduct, error: updateError } = (await (supabase.from('products') as any)
      .update({
        name,
        slug,
        description: description || null,
        category_id: category_id || null,
        base_price: Number(base_price),
        mrp: mrp ? Number(mrp) : Number(base_price),
        gst_percent: Number(gst_percent),
        hsn_code: hsn_code || '620342',
        is_active: Boolean(is_active),
        is_featured: Boolean(is_featured),
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (updateError) {
      throw updateError;
    }

    // 2. Refresh variants
    if (variants && variants.length > 0) {
      await supabase.from('product_variants').delete().eq('product_id', id);
      const variantRows = variants.map((v: any, index: number) => ({
        product_id: id,
        sku: v.sku || `${slug.toUpperCase()}-${v.size || index}`,
        size: v.size || '32',
        fit: v.fit || 'Regular',
        color: v.color || 'Indigo',
        wash: v.wash || 'Raw',
        price: v.price ? Number(v.price) : Number(base_price),
        stock_qty: Number(v.stock_qty || 0),
        barcode: v.barcode || null,
      }));
      await supabase.from('product_variants').insert(variantRows as any);
    }

    // 3. Refresh images
    if (images) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        const imageRows = images.map((img: any, index: number) => ({
          product_id: id,
          path: typeof img === 'string' ? img : img.path,
          sort: typeof img.sort === 'number' ? img.sort : index,
        }));
        await supabase.from('product_images').insert(imageRows as any);
      }
    }

    // Storefront cache revalidation
    try {
      revalidatePath('/products');
      revalidatePath('/');
      if (updatedProduct?.slug) {
        revalidatePath(`/products/${updatedProduct.slug}`);
      }
    } catch (e) {
      console.warn('[Revalidate Warning]:', e);
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    console.error('[Admin Products PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('products');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { data: prod } = (await supabase.from('products').select('slug').eq('id', id).single()) as any;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      throw error;
    }

    try {
      revalidatePath('/products');
      revalidatePath('/');
      if (prod?.slug) {
        revalidatePath(`/products/${prod.slug}`);
      }
    } catch (e) {
      console.warn('[Revalidate Warning]:', e);
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    console.error('[Admin Products DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
