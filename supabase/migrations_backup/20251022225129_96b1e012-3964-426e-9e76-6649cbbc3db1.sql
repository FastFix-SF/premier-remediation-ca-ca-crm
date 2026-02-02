-- Delete messages from conversations that don't include team members
DELETE FROM team_messages
WHERE conversation_id IN (
  SELECT dc.id
  FROM direct_conversations dc
  WHERE NOT EXISTS (
    SELECT 1 FROM team_directory td
    WHERE (td.user_id = dc.participant_one_id OR td.user_id = dc.participant_two_id)
    AND td.status = 'active'
  )
);

-- Delete conversations that don't include team members
DELETE FROM direct_conversations
WHERE NOT EXISTS (
  SELECT 1 FROM team_directory td
  WHERE (td.user_id = direct_conversations.participant_one_id 
         OR td.user_id = direct_conversations.participant_two_id)
  AND td.status = 'active'
);