import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await verifyApiPermission('erp_job_work');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const [{ data: karigars, error: kErr }, { data: challans, error: cErr }] = await Promise.all([
      supabase.from('erp_karigars').select('*').order('name', { ascending: true }),
      supabase
        .from('erp_job_work_challans')
        .select(`
          *,
          karigar:erp_karigars (id, name, phone, department, rate_per_piece),
          production_order:production_orders (id, order_no, product:products(name))
        `)
        .order('created_at', { ascending: false }),
    ]);

    if (kErr) throw kErr;
    if (cErr) throw cErr;

    return NextResponse.json({
      success: true,
      karigars: karigars || [],
      challans: challans || [],
    });
  } catch (err: any) {
    console.error('[Admin ERP JobWork GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_job_work');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();

    // Create Karigar Vendor
    if (body.entity === 'karigar') {
      const { name, phone, department = 'stitching', rate_per_piece = 0, address } = body;
      if (!name) {
        return NextResponse.json({ error: 'Karigar name is required' }, { status: 400 });
      }
      const { data: karigar, error } = (await (supabase.from('erp_karigars') as any)
        .insert({
          name: String(name).trim(),
          phone: phone ? String(phone).trim() : null,
          department,
          rate_per_piece: Math.max(0, Number(rate_per_piece || 0)),
          address: address ? String(address).trim() : null,
        })
        .select('*')
        .single()) as any;
      if (error) throw error;
      return NextResponse.json({ success: true, karigar });
    }

    // Issue Outwork Challan
    const {
      karigar_id,
      production_order_id,
      process_stage = 'stitching',
      qty_issued,
      rate_per_piece = 0,
      due_date,
      notes,
    } = body;

    if (!karigar_id || !qty_issued || Number(qty_issued) <= 0) {
      return NextResponse.json(
        { error: 'Karigar and valid issued piece quantity (> 0) are required' },
        { status: 400 }
      );
    }

    let challanNo = '';
    const { data: seqNo } = await (supabase.rpc as any)('next_erp_doc_no', { doc_type: 'JW' });
    if (seqNo) {
      challanNo = String(seqNo);
    } else {
      challanNo = `TLD-JW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data: challan, error } = (await (supabase.from('erp_job_work_challans') as any)
      .insert({
        challan_no: challanNo,
        karigar_id,
        production_order_id: production_order_id || null,
        process_stage,
        qty_issued: Math.round(Number(qty_issued)),
        qty_returned: 0,
        qty_rejected: 0,
        rate_per_piece: Math.max(0, Number(rate_per_piece || 0)),
        total_wage: 0,
        paid_amount: 0,
        payment_status: 'unpaid',
        status: 'issued',
        due_date: due_date || null,
        notes: notes ? String(notes).trim() : null,
      })
      .select('*')
      .single()) as any;

    if (error) throw error;
    return NextResponse.json({ success: true, challan });
  } catch (err: any) {
    console.error('[Admin ERP JobWork POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_job_work');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();

    if (body.entity === 'karigar') {
      const { id, name, phone, department, rate_per_piece, address, is_active } = body;
      if (!id) return NextResponse.json({ error: 'Karigar ID required' }, { status: 400 });

      const { data: updated, error } = (await (supabase.from('erp_karigars') as any)
        .update({
          ...(name ? { name: String(name).trim() } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(department ? { department } : {}),
          ...(rate_per_piece !== undefined ? { rate_per_piece: Number(rate_per_piece) } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(is_active !== undefined ? { is_active } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()) as any;
      if (error) throw error;
      return NextResponse.json({ success: true, karigar: updated });
    }

    const { id, action, qty_returned, qty_rejected, paid_amount, notes } = body;
    if (!id) return NextResponse.json({ error: 'Challan ID required' }, { status: 400 });

    const { data: existing, error: fetchErr } = (await supabase
      .from('erp_job_work_challans')
      .select('*')
      .eq('id', id)
      .single()) as any;

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Job-work challan not found' }, { status: 404 });
    }

    if (action === 'cancel') {
      const { data: cancelled, error } = (await (supabase.from('erp_job_work_challans') as any)
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()) as any;
      if (error) throw error;
      return NextResponse.json({ success: true, challan: cancelled });
    }

    const nextReturned =
      qty_returned !== undefined
        ? Math.min(existing.qty_issued, Math.max(0, Math.round(Number(qty_returned))))
        : existing.qty_returned;
    const nextRejected =
      qty_rejected !== undefined
        ? Math.max(0, Math.round(Number(qty_rejected)))
        : existing.qty_rejected;

    const totalWage =
      Math.round(nextReturned * Number(existing.rate_per_piece || 0) * 100) / 100;
    const nextPaid =
      paid_amount !== undefined
        ? Math.max(0, Number(paid_amount))
        : Number(existing.paid_amount || 0);

    const nextStatus =
      nextReturned + nextRejected >= existing.qty_issued
        ? 'completed'
        : nextReturned > 0
        ? 'partial_return'
        : existing.status;

    const nextPaymentStatus =
      totalWage > 0 && nextPaid >= totalWage ? 'paid' : nextPaid > 0 ? 'partial' : 'unpaid';

    const { data: updated, error } = (await (supabase.from('erp_job_work_challans') as any)
      .update({
        qty_returned: nextReturned,
        qty_rejected: nextRejected,
        total_wage: totalWage,
        paid_amount: nextPaid,
        status: nextStatus,
        payment_status: nextPaymentStatus,
        notes: notes !== undefined ? notes : existing.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, challan: updated });
  } catch (err: any) {
    console.error('[Admin ERP JobWork PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_job_work');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const entity = searchParams.get('entity');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const table = entity === 'karigar' ? 'erp_karigars' : 'erp_job_work_challans';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
