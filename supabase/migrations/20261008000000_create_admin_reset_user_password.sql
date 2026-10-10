-- Migration: Criar RPC para reset de senha administrativa
-- Permite que usuários com role 'admin' redefinam a senha de qualquer usuário (estudante/professor)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  target_user_id UUID,
  new_password TEXT DEFAULT 'balbina123'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 1. Verificar se o usuário que está chamando a função é admin
  SELECT role INTO caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS NULL OR caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem redefinir senhas.';
  END IF;

  -- 2. Validar parâmetros
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'ID de usuário inválido.';
  END IF;

  IF new_password IS NULL OR length(trim(new_password)) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
  END IF;

  -- 3. Atualizar a senha criptografada na tabela auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado na base de autenticação.';
  END IF;
END;
$$;

-- Permitir que usuários autenticados chamem a função (a validação de ser admin ocorre internamente via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_reset_user_password(UUID, TEXT) IS 'Redefine a senha de um usuário no Supabase Auth. Requer papel de administrador.';
