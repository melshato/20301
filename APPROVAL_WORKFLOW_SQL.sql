-- ============================================================
-- Approval Workflow SQL (Admin + Head) with approval_history
-- Sequence:
--   pending_approval (Surveyoer submitted)
--   -> pending_admin_approval (Admin approved)
--   -> pending_head_approval (Head approved)
--   -> approved
-- Rejection:
--   any reject => status = 'rejected'
-- ============================================================

-- 0) ملاحظة: مشروعك الحالي لا يملك قيمة 'rejected' في CHECK
-- على custodies.status. لذلك سنقوم بتعديل CHECK لإضافة rejected.

ALTER TABLE custodies
  DROP CONSTRAINT IF EXISTS custodies_status_check;

ALTER TABLE custodies
  ADD CONSTRAINT custodies_status_check
  CHECK (
    status IN (
      'approved',
      'pending_approval',
      'pending_admin_approval',
      'pending_head_approval',
      'rejected'
    )
  );

-- ============================================================
-- 1) Function: append event into approval_history
-- ============================================================
CREATE OR REPLACE FUNCTION _append_approval_history(
  _old JSONB,
  _actor_role TEXT,
  _actor_id UUID,
  _actor_name TEXT,
  _action TEXT,
  _result TEXT,
  _note TEXT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  _event JSONB;
BEGIN
  IF _old IS NULL THEN
    _old := '[]'::jsonb;
  END IF;

  _event := jsonb_build_object(
    'timestamp', now(),
    'actorRole', _actor_role,
    'actorId', _actor_id,
    'actorName', _actor_name,
    'action', _action,
    'result', _result,
    'note', _note
  );

  RETURN (_old || jsonb_build_array(_event));
END;
$$;

-- ============================================================
-- 2) Function: submit custody (Surveyoer -> pending_approval)
-- ============================================================
-- تنبيه: في مشروعك، إدراج custodies موجود بالفعل من الـfrontend.
-- هذه الدالة فقط اختيارية لتوحيد المنطق.
CREATE OR REPLACE FUNCTION custody_submit(
  _custody_id UUID,
  _note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  _role TEXT;
  _name TEXT;
BEGIN
  SELECT role, name INTO _role, _name FROM users WHERE id = auth.uid();

  IF _role NOT IN ('surveyor','head','admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE custodies
  SET status = 'pending_approval',
      approval_history = _append_approval_history(
        approval_history,
        _role,
        auth.uid(),
        _name,
        'submit',
        'submitted',
        _note
      )
  WHERE id = _custody_id;
END;
$$;

-- ============================================================
-- 3) Function: Admin action
-- ============================================================
CREATE OR REPLACE FUNCTION custody_admin_decide(
  _custody_id UUID,
  _approve BOOLEAN,
  _note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  _role TEXT;
  _name TEXT;
  _new_status TEXT;
  _result TEXT;
BEGIN
  SELECT role, name INTO _role, _name FROM users WHERE id = auth.uid();

  IF _role <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can do this';
  END IF;

  -- صلاحية المرحلة
  IF NOT EXISTS (
    SELECT 1 FROM custodies
    WHERE id = _custody_id AND status IN ('pending_approval','pending_admin_approval')
  ) THEN
    RAISE EXCEPTION 'Custody not in admin-decisable state';
  END IF;

  IF _approve THEN
    _new_status := 'pending_head_approval';
    _result := 'approved';
  ELSE
    _new_status := 'rejected';
    _result := 'rejected';
  END IF;

  UPDATE custodies
  SET status = _new_status,
      approval_history = _append_approval_history(
        approval_history,
        'admin',
        auth.uid(),
        _name,
        'admin_decide',
        _result,
        _note
      )
  WHERE id = _custody_id;
END;
$$;

-- ============================================================
-- 4) Function: Head action
-- ============================================================
CREATE OR REPLACE FUNCTION custody_head_decide(
  _custody_id UUID,
  _approve BOOLEAN,
  _note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  _role TEXT;
  _name TEXT;
  _new_status TEXT;
  _result TEXT;
BEGIN
  SELECT role, name INTO _role, _name FROM users WHERE id = auth.uid();

  IF _role <> 'head' THEN
    RAISE EXCEPTION 'Only head can do this';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM custodies
    WHERE id = _custody_id AND status IN ('pending_head_approval')
  ) THEN
    RAISE EXCEPTION 'Custody not in head-decisable state';
  END IF;

  IF _approve THEN
    _new_status := 'approved';
    _result := 'approved';
  ELSE
    _new_status := 'rejected';
    _result := 'rejected';
  END IF;

  UPDATE custodies
  SET status = _new_status,
      approval_history = _append_approval_history(
        approval_history,
        'head',
        auth.uid(),
        _name,
        'head_decide',
        _result,
        _note
      )
  WHERE id = _custody_id;
END;
$$;

-- ============================================================
-- 5) Permissions: functions execution
-- ============================================================
GRANT EXECUTE ON FUNCTION custody_admin_decide(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION custody_head_decide(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION custody_submit(UUID, TEXT) TO authenticated;

