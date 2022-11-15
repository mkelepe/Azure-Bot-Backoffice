-- public.meeting definition

-- Drop table

-- DROP TABLE public.meeting;

CREATE TABLE public.meeting (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	meeting_url text NOT NULL DEFAULT 'NA'::text,
	assigned_agent text NOT NULL DEFAULT '-'::text,
	status text NOT NULL DEFAULT 'requested'::text,
	form_name text NOT NULL,
	form_surname text NOT NULL,
	form_mobile text NOT NULL,
	form_email text NOT NULL,
	form_details text NOT NULL,
	form_afm text NOT NULL,
	form_klidarithmos text NOT NULL,
	reject_reason text NULL,
	meeting_id text NULL,
	created_at timestamp NOT NULL,
	CONSTRAINT meeting_pkey PRIMARY KEY (id)
);
CREATE INDEX index_meeting_assigned_agent ON public.meeting USING btree (assigned_agent);
CREATE INDEX index_meeting_created_at ON public.meeting USING btree (created_at);
CREATE INDEX index_meeting_status ON public.meeting USING btree (status);

-- public.setting definition

-- Drop table

-- DROP TABLE public.setting;

CREATE TABLE public.setting (
	id text NOT NULL,
	jsonvalue jsonb NOT NULL DEFAULT jsonb_build_object(),
	CONSTRAINT setting_pkey PRIMARY KEY (id)
);

INSERT INTO public.setting
(id, jsonvalue)
VALUES('chatbox_configuration', '{"chatBoxStart": true, "maxWaitingQueue": "10", "avgMeetingDuration": "20"}'::jsonb);

