-- Assign test workers to the test supervisor
UPDATE public.profiles 
SET supervisor_id = 'c7af3b1a-189a-467b-8750-9b837c46be3b'
WHERE id IN (
  '4042aaff-2dfe-41aa-b389-d48601d0a0bd',
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222'
);

-- Also approve pending test workers so they show up
UPDATE public.profiles
SET account_status = 'approved'
WHERE id IN (
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222'
);