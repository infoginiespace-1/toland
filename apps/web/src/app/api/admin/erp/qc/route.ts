import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_qc');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('erp_qc_inspections')
      .select(`
        *,
        production_order:production_orders (id, order_no, product:products(name)),
        raw_material:raw_materials (id, name, batch_lot_no, shade)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, inspections: data || [] });
  } catch (err: any) {
    console.error('[Admin ERP QC GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_qc');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      inspection_type = 'stage',
      production_order_id,
      raw_material_id,
      stage_name,
      pass_qty = 0,
      rework_qty = 0,
      reject_qty = 0,
      defect_reason,
      gsm_actual,
      shrinkage_pct,
      inspector_name,
      notes,
    } = body;

    const passNum = Math.max(0, Math.round(Number(pass_qty || 0)));
    const reworkNum = Math.max(0, Math.round(Number(rework_qty || 0)));
    const rejectNum = Math.max(0, Math.round(Number(reject_qty || 0)));
    const inspectedQty = passNum + reworkNum + rejectNum;

    if (inspectedQty <= 0) {
      return NextResponse.json(
        { error: 'Total inspected quantity (Pass + Rework + Reject) must be greater than 0' },
        { status: 400 }
      );
    }

    let qcNo = '';
    const { data: seqNo } = await (supabase.rpc as any)('next_erp_doc_no', { doc_type: 'QC' });
    if (seqNo) {
      qcNo = String(seqNo);
    } else {
      qcNo = `TLD-QC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const computedStatus =
      rejectNum > 0 && passNum === 0
        ? 'failed'
        : reworkNum > 0
        ? 'rework_required'
        : 'passed';

    const { data: inspection, error } = (await (supabase.from('erp_qc_inspections') as any)
      .insert({
        qc_no: qcNo,
        inspection_type,
        production_order_id: production_order_id || null,
        raw_material_id: raw_material_id || null,
        stage_name: stage_name || null,
        inspected_qty: inspectedQty,
        pass_qty: passNum,
        rework_qty: reworkNum,
        reject_qty: rejectNum,
        defect_reason: defect_reason ? String(defect_reason).trim() : null,
        gsm_actual: gsm_actual !== '' && gsm_actual != null ? Number(gsm_actual) : null,
        shrinkage_pct: shrinkage_pct !== '' && shrinkage_pct != null ? Number(shrinkage_pct) : null,
        inspector_name: inspector_name ? String(inspector_name).trim() : null,
        status: computedStatus,
        notes: notes ? String(notes).trim() : null,
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, inspection });
  } catch (err: any) {
    console.error('[Admin ERP QC POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_qc');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, pass_qty, rework_qty, reject_qty, status, defect_reason, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'QC Inspection ID is required' }, { status: 400 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (pass_qty !== undefined || rework_qty !== undefined || reject_qty !== undefined) {
      const p = Math.max(0, Math.round(Number(pass_qty || 0)));
      const r = Math.max(0, Math.round(Number(rework_qty || 0)));
      const x = Math.max(0, Math.round(Number(reject_qty || 0)));
      updatePayload.pass_qty = p;
      updatePayload.rework_qty = r;
      updatePayload.reject_qty = x;
      updatePayload.inspected_qty = p + r + x;
      updatePayload.status =
        status || (x > 0 && p === 0 ? 'failed' : r > 0 ? 'rework_required' : 'passed');
    } else if (status) {
      updatePayload.status = status;
    }

    if (defect_reason !== undefined) updatePayload.defect_reason = defect_reason;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data: updated, error } = (await (supabase.from('erp_qc_inspections') as any)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, inspection: updated });
  } catch (err: any) {
    console.error('[Admin ERP QC PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_qc');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase.from('erp_qc_inspections').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
