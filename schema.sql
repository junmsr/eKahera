--
-- PostgreSQL database dump
--

\restrict zVddKKqCOAk48iEuxWQhCXKdQ3D2LQRHgUFbLhzWRvU2gLvf3aWN9wogGHiYA1a

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: _add_fk_if_missing(text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._add_fk_if_missing(src_table text, src_col text, dst_table text, dst_col text, constraint_name text, on_update text DEFAULT 'NO ACTION'::text, on_delete text DEFAULT 'NO ACTION'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu USING (constraint_name, constraint_schema)
    WHERE tc.table_schema = 'public' AND tc.table_name = src_table AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = src_col
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON UPDATE %s ON DELETE %s',
                   src_table, constraint_name, src_col, dst_table, dst_col, on_update, on_delete);
  END IF;
END;
$$;


--
-- Name: enforce_business_user_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_business_user_admin() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: business_business_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_business_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: business; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business (
    business_id integer DEFAULT nextval('public.business_business_id_seq'::regclass) NOT NULL,
    business_name character varying(255) NOT NULL,
    business_type character varying(100) NOT NULL,
    region character varying(100) NOT NULL,
    business_address text NOT NULL,
    house_number character varying(100),
    mobile character varying(15) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    verification_submitted_at timestamp with time zone,
    verification_reviewed_at timestamp with time zone,
    verification_reviewed_by integer,
    verification_rejection_reason text,
    verification_resubmission_notes text,
    CONSTRAINT check_business_verification_status CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    transaction_id integer DEFAULT nextval('public.transactions_transaction_id_seq'::regclass) NOT NULL,
    cashier_user_id integer,
    customer_user_id integer,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id integer,
    transaction_number text NOT NULL
);


--
-- Name: admin_dashboard_sales; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.admin_dashboard_sales AS
 SELECT b.business_id,
    b.business_name,
    sum(t.total_amount) AS total_sales,
    count(t.transaction_id) AS total_transactions
   FROM (public.business b
     LEFT JOIN public.transactions t ON ((b.business_id = t.business_id)))
  GROUP BY b.business_id, b.business_name;


--
-- Name: business_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_documents (
    document_id integer DEFAULT nextval('public.business_documents_document_id_seq'::regclass) NOT NULL,
    business_id integer NOT NULL,
    document_type character varying(100) NOT NULL,
    document_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    verification_notes text,
    verified_by integer,
    verified_at timestamp with time zone,
    uploaded_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_document_file_size CHECK ((file_size <= 10485760)),
    CONSTRAINT check_document_verification_status CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer DEFAULT nextval('public.users_user_id_seq'::regclass) NOT NULL,
    user_type_id integer,
    username character varying(50) NOT NULL,
    contact_number character varying(11),
    email character varying(255),
    password_hash character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    business_id integer,
    first_name character varying(255) DEFAULT 'N/A'::character varying NOT NULL,
    last_name character varying(255) DEFAULT 'N/A'::character varying NOT NULL
);


--
-- Name: business_verification_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.business_verification_summary AS
 SELECT b.business_id,
    b.business_name,
    b.business_type,
    b.email,
    b.verification_status,
    b.verification_submitted_at,
    b.verification_reviewed_at,
    u.username AS reviewed_by_username,
    count(bd.document_id) AS total_documents,
    count(
        CASE
            WHEN ((bd.verification_status)::text = 'approved'::text) THEN 1
            ELSE NULL::integer
        END) AS approved_documents,
    count(
        CASE
            WHEN ((bd.verification_status)::text = 'rejected'::text) THEN 1
            ELSE NULL::integer
        END) AS rejected_documents,
    count(
        CASE
            WHEN ((bd.verification_status)::text = 'pending'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_documents
   FROM ((public.business b
     LEFT JOIN public.business_documents bd ON ((b.business_id = bd.business_id)))
     LEFT JOIN public.users u ON ((b.verification_reviewed_by = u.user_id)))
  GROUP BY b.business_id, b.business_name, b.business_type, b.email, b.verification_status, b.verification_submitted_at, b.verification_reviewed_at, u.username;


--
-- Name: cashier_performance_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.cashier_performance_view AS
 SELECT u.user_id AS cashier_id,
    u.username AS cashier_name,
    t.business_id,
    count(t.transaction_id) AS total_transactions_handled,
    sum(t.total_amount) AS total_sales_generated,
    avg(t.total_amount) AS average_transaction_value,
    min(t.created_at) AS first_transaction,
    max(t.created_at) AS last_transaction
   FROM (public.users u
     JOIN public.transactions t ON ((u.user_id = t.cashier_user_id)))
  WHERE ((t.status)::text = 'completed'::text)
  GROUP BY u.user_id, u.username, t.business_id
  ORDER BY (sum(t.total_amount)) DESC;


--
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_categories_product_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    product_category_id integer DEFAULT nextval('public.product_categories_product_category_id_seq'::regclass) NOT NULL,
    product_category_name character varying(50),
    business_id integer
);


--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    product_id integer DEFAULT nextval('public.products_product_id_seq'::regclass) NOT NULL,
    product_category_id integer,
    product_name character varying(50) NOT NULL,
    cost_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    sku character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by_user_id integer,
    business_id integer,
    description text,
    low_stock_alert integer DEFAULT 5 NOT NULL,
    base_unit character varying(10) DEFAULT 'pc'::character varying NOT NULL,
    display_unit character varying(50),
    quantity_per_unit numeric(10,4) DEFAULT 1 NOT NULL,
    product_type character varying(20) DEFAULT 'count'::character varying NOT NULL,
    CONSTRAINT chk_products_base_unit CHECK (((base_unit)::text = ANY ((ARRAY['pc'::character varying, 'kg'::character varying, 'g'::character varying, 'L'::character varying, 'mL'::character varying])::text[]))),
    CONSTRAINT chk_products_product_type CHECK (((product_type)::text = ANY ((ARRAY['count'::character varying, 'weight'::character varying, 'volume'::character varying])::text[]))),
    CONSTRAINT chk_products_quantity_per_unit CHECK ((quantity_per_unit > (0)::numeric)),
    CONSTRAINT low_stock_alert_non_negative CHECK ((low_stock_alert >= 0))
);


--
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaction_items_transaction_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_items (
    transaction_item_id integer DEFAULT nextval('public.transaction_items_transaction_item_id_seq'::regclass) NOT NULL,
    transaction_id integer,
    product_id integer,
    product_quantity integer NOT NULL,
    price_at_sale numeric(12,2),
    subtotal numeric(12,2) GENERATED ALWAYS AS (((COALESCE(product_quantity, 0))::numeric * COALESCE(price_at_sale, (0)::numeric))) STORED
);


--
-- Name: category_sales_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.category_sales_view AS
 SELECT p.business_id,
    pc.product_category_id,
    pc.product_category_name,
    sum(ti.product_quantity) AS total_items_sold,
    sum(ti.subtotal) AS total_revenue
   FROM (((public.products p
     JOIN public.product_categories pc ON ((p.product_category_id = pc.product_category_id)))
     JOIN public.transaction_items ti ON ((p.product_id = ti.product_id)))
     JOIN public.transactions t ON ((t.transaction_id = ti.transaction_id)))
  WHERE ((t.status)::text = 'completed'::text)
  GROUP BY p.business_id, pc.product_category_id, pc.product_category_name
  ORDER BY (sum(ti.subtotal)) DESC;


--
-- Name: discounts_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discounts_discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discounts (
    discount_id integer DEFAULT nextval('public.discounts_discount_id_seq'::regclass) NOT NULL,
    discount_name character varying(20),
    discount_percentage numeric(10,2)
);


--
-- Name: email_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_notifications (
    notification_id integer DEFAULT nextval('public.email_notifications_notification_id_seq'::regclass) NOT NULL,
    recipient_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    notification_type character varying(100) NOT NULL,
    business_id integer,
    user_id integer,
    sent_at timestamp with time zone DEFAULT now(),
    status character varying(50) DEFAULT 'sent'::character varying
);


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    inventory_id integer DEFAULT nextval('public.inventory_inventory_id_seq'::regclass) NOT NULL,
    product_id integer,
    quantity_in_stock integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id integer,
    CONSTRAINT inventory_quantity_nonneg CHECK ((quantity_in_stock >= 0))
);


--
-- Name: inventory_movement_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.inventory_movement_view AS
 SELECT p.business_id,
    p.product_id,
    p.product_name,
    pc.product_category_name,
    i.quantity_in_stock,
    COALESCE(sum(ti.product_quantity), (0)::bigint) AS total_sold,
    (i.quantity_in_stock + COALESCE(sum(ti.product_quantity), (0)::bigint)) AS total_handled
   FROM ((((public.products p
     LEFT JOIN public.inventory i ON ((p.product_id = i.product_id)))
     LEFT JOIN public.transaction_items ti ON ((p.product_id = ti.product_id)))
     LEFT JOIN public.transactions t ON (((ti.transaction_id = t.transaction_id) AND ((t.status)::text = 'completed'::text))))
     LEFT JOIN public.product_categories pc ON ((p.product_category_id = pc.product_category_id)))
  GROUP BY p.business_id, p.product_id, p.product_name, pc.product_category_name, i.quantity_in_stock
  ORDER BY COALESCE(sum(ti.product_quantity), (0)::bigint) DESC;


--
-- Name: logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs (
    log_id integer DEFAULT nextval('public.logs_log_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    business_id integer NOT NULL,
    action text NOT NULL,
    date_time timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text)
);


--
-- Name: pending_verifications; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.pending_verifications AS
 SELECT b.business_id,
    b.business_name,
    b.business_type,
    b.email,
    b.mobile,
    b.business_address,
    b.region AS country,
    b.verification_submitted_at,
    count(bd.document_id) AS total_documents,
    count(
        CASE
            WHEN ((bd.verification_status)::text = 'pending'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_documents
   FROM (public.business b
     LEFT JOIN public.business_documents bd ON ((b.business_id = bd.business_id)))
  WHERE ((b.verification_status)::text = 'pending'::text)
  GROUP BY b.business_id, b.business_name, b.business_type, b.email, b.mobile, b.business_address, b.region, b.verification_submitted_at
  ORDER BY b.verification_submitted_at;


--
-- Name: profit_analysis_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profit_analysis_view AS
 SELECT p.business_id,
    p.product_id,
    p.product_name,
    pc.product_category_name,
    sum(ti.product_quantity) AS total_quantity_sold,
    sum(ti.subtotal) AS total_revenue,
    sum(((ti.product_quantity)::numeric * p.cost_price)) AS total_cost,
    (sum(ti.subtotal) - sum(((ti.product_quantity)::numeric * p.cost_price))) AS gross_profit,
        CASE
            WHEN (sum(ti.subtotal) = (0)::numeric) THEN (0)::numeric
            ELSE (((sum(ti.subtotal) - sum(((ti.product_quantity)::numeric * p.cost_price))) / sum(ti.subtotal)) * (100)::numeric)
        END AS profit_margin_percentage
   FROM (((public.products p
     JOIN public.product_categories pc ON ((p.product_category_id = pc.product_category_id)))
     JOIN public.transaction_items ti ON ((p.product_id = ti.product_id)))
     JOIN public.transactions t ON ((ti.transaction_id = t.transaction_id)))
  WHERE ((t.status)::text = 'completed'::text)
  GROUP BY p.business_id, p.product_id, p.product_name, pc.product_category_name
  ORDER BY (sum(ti.subtotal) - sum(((ti.product_quantity)::numeric * p.cost_price))) DESC;


--
-- Name: returned_items_returned_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.returned_items_returned_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: returns_return_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.returns_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_summary_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sales_summary_view AS
 SELECT COALESCE(t.business_id, 0) AS business_id,
    date(t.created_at) AS sale_date,
    count(DISTINCT t.transaction_id) AS total_transactions,
    COALESCE(sum(t.total_amount), (0)::numeric) AS total_sales_amount,
    COALESCE(sum(ti.product_quantity), (0)::bigint) AS total_items_sold,
        CASE
            WHEN (count(DISTINCT t.transaction_id) = 0) THEN (0)::numeric
            ELSE (COALESCE(sum(t.total_amount), (0)::numeric) / (count(DISTINCT t.transaction_id))::numeric)
        END AS average_transaction_value
   FROM (public.transactions t
     LEFT JOIN public.transaction_items ti ON ((t.transaction_id = ti.transaction_id)))
  WHERE ((t.status)::text = 'completed'::text)
  GROUP BY t.business_id, (date(t.created_at))
  ORDER BY (date(t.created_at)) DESC;


--
-- Name: store_deletion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_deletion_requests (
    id integer NOT NULL,
    business_id integer NOT NULL,
    requested_by integer,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    export_path text,
    export_type character varying(20),
    export_ready_at timestamp with time zone,
    export_size_bytes bigint,
    recovered_at timestamp with time zone,
    deleted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: store_deletion_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_deletion_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_deletion_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_deletion_requests_id_seq OWNED BY public.store_deletion_requests.id;


--
-- Name: top_selling_products; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.top_selling_products AS
SELECT
    NULL::integer AS business_id,
    NULL::integer AS product_id,
    NULL::character varying(50) AS product_name,
    NULL::character varying(50) AS product_category_name,
    NULL::bigint AS total_sold,
    NULL::numeric AS total_revenue;


--
-- Name: transaction_payment_transasction_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaction_payment_transasction_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaction_payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_payment (
    transaction_payment_id integer DEFAULT nextval('public.transaction_payment_transasction_payment_id_seq'::regclass) NOT NULL,
    user_id integer,
    discount_id integer,
    payment_type character varying(20) NOT NULL,
    money_received numeric(10,2),
    money_change numeric(10,2),
    transaction_date date DEFAULT CURRENT_DATE NOT NULL,
    transaction_id integer
);


--
-- Name: user_type_user_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_type_user_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_type (
    user_type_id integer DEFAULT nextval('public.user_type_user_type_id_seq'::regclass) NOT NULL,
    user_type_name character varying(20)
);


--
-- Name: store_deletion_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_deletion_requests ALTER COLUMN id SET DEFAULT nextval('public.store_deletion_requests_id_seq'::regclass);


--
-- Name: business_documents business_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_documents
    ADD CONSTRAINT business_documents_pkey PRIMARY KEY (document_id);


--
-- Name: business business_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_email_unique UNIQUE (email);


--
-- Name: business business_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_pkey PRIMARY KEY (business_id);


--
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (discount_id);


--
-- Name: email_notifications email_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);


--
-- Name: product_categories product_categories_business_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_business_name_unique UNIQUE (business_id, product_category_name);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_category_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: store_deletion_requests store_deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_deletion_requests
    ADD CONSTRAINT store_deletion_requests_pkey PRIMARY KEY (id);


--
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (transaction_item_id);


--
-- Name: transaction_payment transaction_payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT transaction_payment_pkey PRIMARY KEY (transaction_payment_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: transactions transactions_transaction_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_number_key UNIQUE (transaction_number);


--
-- Name: user_type user_type_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_type
    ADD CONSTRAINT user_type_name_unique UNIQUE (user_type_name);


--
-- Name: user_type user_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_type
    ADD CONSTRAINT user_type_pkey PRIMARY KEY (user_type_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_business_documents_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_documents_business_id ON public.business_documents USING btree (business_id);


--
-- Name: idx_business_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_documents_status ON public.business_documents USING btree (verification_status);


--
-- Name: idx_business_documents_uploaded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_documents_uploaded_at ON public.business_documents USING btree (uploaded_at);


--
-- Name: idx_business_documents_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_documents_verification_status ON public.business_documents USING btree (verification_status);


--
-- Name: idx_business_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_email ON public.business USING btree (email);


--
-- Name: idx_business_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_verification_status ON public.business USING btree (verification_status);


--
-- Name: idx_business_verification_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_verification_submitted_at ON public.business USING btree (verification_submitted_at);


--
-- Name: idx_email_notifications_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_business_id ON public.email_notifications USING btree (business_id);


--
-- Name: idx_email_notifications_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_sent_at ON public.email_notifications USING btree (sent_at);


--
-- Name: idx_email_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_type ON public.email_notifications USING btree (notification_type);


--
-- Name: idx_inventory_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_business_id ON public.inventory USING btree (business_id);


--
-- Name: idx_inventory_product_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_product_business ON public.inventory USING btree (product_id, business_id);


--
-- Name: idx_inventory_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_product_id ON public.inventory USING btree (product_id);


--
-- Name: idx_payment_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_tx ON public.transaction_payment USING btree (transaction_id);


--
-- Name: idx_payment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_user ON public.transaction_payment USING btree (user_id);


--
-- Name: idx_products_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_business ON public.products USING btree (business_id);


--
-- Name: idx_products_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_business_id ON public.products USING btree (business_id);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_id ON public.products USING btree (product_category_id);


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at);


--
-- Name: idx_products_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_by ON public.products USING btree (created_by_user_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_store_deletion_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_deletion_business ON public.store_deletion_requests USING btree (business_id);


--
-- Name: idx_store_deletion_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_deletion_status ON public.store_deletion_requests USING btree (status, scheduled_for);


--
-- Name: idx_transaction_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_items_product ON public.transaction_items USING btree (product_id);


--
-- Name: idx_transaction_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_items_product_id ON public.transaction_items USING btree (product_id);


--
-- Name: idx_transaction_items_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items USING btree (transaction_id);


--
-- Name: idx_transaction_items_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_items_tx ON public.transaction_items USING btree (transaction_id);


--
-- Name: idx_transaction_payment_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_payment_transaction_id ON public.transaction_payment USING btree (transaction_id);


--
-- Name: idx_transaction_payment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_payment_type ON public.transaction_payment USING btree (payment_type);


--
-- Name: idx_transactions_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_business_id ON public.transactions USING btree (business_id);


--
-- Name: idx_transactions_business_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_business_status ON public.transactions USING btree (business_id, status);


--
-- Name: idx_transactions_cashier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_cashier ON public.transactions USING btree (cashier_user_id);


--
-- Name: idx_transactions_cashier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_cashier_id ON public.transactions USING btree (cashier_user_id);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--
-- Name: idx_transactions_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_updated_at ON public.transactions USING btree (updated_at);


--
-- Name: idx_users_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_business_id ON public.users USING btree (business_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: top_selling_products _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.top_selling_products AS
 SELECT p.business_id,
    p.product_id,
    p.product_name,
    pc.product_category_name,
    sum(ti.product_quantity) AS total_sold,
    sum(ti.subtotal) AS total_revenue
   FROM (((public.products p
     JOIN public.product_categories pc ON ((p.product_category_id = pc.product_category_id)))
     JOIN public.transaction_items ti ON ((p.product_id = ti.product_id)))
     JOIN public.transactions t ON ((t.transaction_id = ti.transaction_id)))
  WHERE ((t.status)::text = 'completed'::text)
  GROUP BY p.business_id, p.product_id, pc.product_category_name
  ORDER BY (sum(ti.product_quantity)) DESC;


--
-- Name: business trg_enforce_business_user_admin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_business_user_admin BEFORE INSERT OR UPDATE ON public.business FOR EACH ROW EXECUTE FUNCTION public.enforce_business_user_admin();


--
-- Name: business_documents update_business_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_documents_updated_at BEFORE UPDATE ON public.business_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: business update_business_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_updated_at BEFORE UPDATE ON public.business FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inventory update_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: business_documents business_documents_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_documents
    ADD CONSTRAINT business_documents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business(business_id) ON DELETE CASCADE;


--
-- Name: business_documents business_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_documents
    ADD CONSTRAINT business_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(user_id);


--
-- Name: business business_verification_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_verification_reviewed_by_fkey FOREIGN KEY (verification_reviewed_by) REFERENCES public.users(user_id);


--
-- Name: email_notifications email_notifications_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- Name: email_notifications email_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: transaction_items fk_cart_product_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT fk_cart_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaction_items fk_cart_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT fk_cart_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory fk_inventory_business; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- Name: inventory fk_inventory_product_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: logs fk_logs_business; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- Name: logs fk_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: products fk_products_business; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- Name: products fk_products_created_by_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transaction_payment fk_transaction_payment_discount_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_discount_id FOREIGN KEY (discount_id) REFERENCES public.discounts(discount_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaction_payment fk_transaction_payment_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaction_payment fk_transaction_payment_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions fk_transactions_business; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- Name: transactions fk_transactions_cashier_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_cashier_user_id FOREIGN KEY (cashier_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions fk_transactions_customer_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_customer_user_id FOREIGN KEY (customer_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_categories product_categories_business_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_business_fk FOREIGN KEY (business_id) REFERENCES public.business(business_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_business_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_business_fk FOREIGN KEY (business_id) REFERENCES public.business(business_id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION _add_fk_if_missing(src_table text, src_col text, dst_table text, dst_col text, constraint_name text, on_update text, on_delete text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public._add_fk_if_missing(src_table text, src_col text, dst_table text, dst_col text, constraint_name text, on_update text, on_delete text) TO anon;
GRANT ALL ON FUNCTION public._add_fk_if_missing(src_table text, src_col text, dst_table text, dst_col text, constraint_name text, on_update text, on_delete text) TO authenticated;
GRANT ALL ON FUNCTION public._add_fk_if_missing(src_table text, src_col text, dst_table text, dst_col text, constraint_name text, on_update text, on_delete text) TO service_role;


--
-- Name: FUNCTION enforce_business_user_admin(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.enforce_business_user_admin() TO anon;
GRANT ALL ON FUNCTION public.enforce_business_user_admin() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_business_user_admin() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: SEQUENCE business_business_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.business_business_id_seq TO anon;
GRANT ALL ON SEQUENCE public.business_business_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.business_business_id_seq TO service_role;


--
-- Name: TABLE business; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.business TO anon;
GRANT ALL ON TABLE public.business TO authenticated;
GRANT ALL ON TABLE public.business TO service_role;


--
-- Name: SEQUENCE transactions_transaction_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.transactions_transaction_id_seq TO anon;
GRANT ALL ON SEQUENCE public.transactions_transaction_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.transactions_transaction_id_seq TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE admin_dashboard_sales; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_dashboard_sales TO anon;
GRANT ALL ON TABLE public.admin_dashboard_sales TO authenticated;
GRANT ALL ON TABLE public.admin_dashboard_sales TO service_role;


--
-- Name: SEQUENCE business_documents_document_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.business_documents_document_id_seq TO anon;
GRANT ALL ON SEQUENCE public.business_documents_document_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.business_documents_document_id_seq TO service_role;


--
-- Name: TABLE business_documents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.business_documents TO anon;
GRANT ALL ON TABLE public.business_documents TO authenticated;
GRANT ALL ON TABLE public.business_documents TO service_role;


--
-- Name: SEQUENCE users_user_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.users_user_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_user_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_user_id_seq TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE business_verification_summary; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.business_verification_summary TO anon;
GRANT ALL ON TABLE public.business_verification_summary TO authenticated;
GRANT ALL ON TABLE public.business_verification_summary TO service_role;


--
-- Name: TABLE cashier_performance_view; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cashier_performance_view TO anon;
GRANT ALL ON TABLE public.cashier_performance_view TO authenticated;
GRANT ALL ON TABLE public.cashier_performance_view TO service_role;


--
-- Name: SEQUENCE product_categories_product_category_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.product_categories_product_category_id_seq TO anon;
GRANT ALL ON SEQUENCE public.product_categories_product_category_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.product_categories_product_category_id_seq TO service_role;


--
-- Name: TABLE product_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_categories TO anon;
GRANT ALL ON TABLE public.product_categories TO authenticated;
GRANT ALL ON TABLE public.product_categories TO service_role;


--
-- Name: SEQUENCE products_product_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.products_product_id_seq TO anon;
GRANT ALL ON SEQUENCE public.products_product_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.products_product_id_seq TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: SEQUENCE transaction_items_transaction_item_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.transaction_items_transaction_item_id_seq TO anon;
GRANT ALL ON SEQUENCE public.transaction_items_transaction_item_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.transaction_items_transaction_item_id_seq TO service_role;


--
-- Name: TABLE transaction_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.transaction_items TO anon;
GRANT ALL ON TABLE public.transaction_items TO authenticated;
GRANT ALL ON TABLE public.transaction_items TO service_role;


--
-- Name: TABLE category_sales_view; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.category_sales_view TO anon;
GRANT ALL ON TABLE public.category_sales_view TO authenticated;
GRANT ALL ON TABLE public.category_sales_view TO service_role;


--
-- Name: SEQUENCE discounts_discount_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.discounts_discount_id_seq TO anon;
GRANT ALL ON SEQUENCE public.discounts_discount_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.discounts_discount_id_seq TO service_role;


--
-- Name: TABLE discounts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.discounts TO anon;
GRANT ALL ON TABLE public.discounts TO authenticated;
GRANT ALL ON TABLE public.discounts TO service_role;


--
-- Name: SEQUENCE email_notifications_notification_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.email_notifications_notification_id_seq TO anon;
GRANT ALL ON SEQUENCE public.email_notifications_notification_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.email_notifications_notification_id_seq TO service_role;


--
-- Name: TABLE email_notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.email_notifications TO anon;
GRANT ALL ON TABLE public.email_notifications TO authenticated;
GRANT ALL ON TABLE public.email_notifications TO service_role;


--
-- Name: SEQUENCE inventory_inventory_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.inventory_inventory_id_seq TO anon;
GRANT ALL ON SEQUENCE public.inventory_inventory_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.inventory_inventory_id_seq TO service_role;


--
-- Name: TABLE inventory; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.inventory TO anon;
GRANT ALL ON TABLE public.inventory TO authenticated;
GRANT ALL ON TABLE public.inventory TO service_role;


--
-- Name: TABLE inventory_movement_view; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.inventory_movement_view TO anon;
GRANT ALL ON TABLE public.inventory_movement_view TO authenticated;
GRANT ALL ON TABLE public.inventory_movement_view TO service_role;


--
-- Name: SEQUENCE logs_log_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.logs_log_id_seq TO anon;
GRANT ALL ON SEQUENCE public.logs_log_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.logs_log_id_seq TO service_role;


--
-- Name: TABLE logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.logs TO anon;
GRANT ALL ON TABLE public.logs TO authenticated;
GRANT ALL ON TABLE public.logs TO service_role;


--
-- Name: TABLE pending_verifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pending_verifications TO anon;
GRANT ALL ON TABLE public.pending_verifications TO authenticated;
GRANT ALL ON TABLE public.pending_verifications TO service_role;


--
-- Name: TABLE profit_analysis_view; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profit_analysis_view TO anon;
GRANT ALL ON TABLE public.profit_analysis_view TO authenticated;
GRANT ALL ON TABLE public.profit_analysis_view TO service_role;


--
-- Name: SEQUENCE returned_items_returned_items_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.returned_items_returned_items_id_seq TO anon;
GRANT ALL ON SEQUENCE public.returned_items_returned_items_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.returned_items_returned_items_id_seq TO service_role;


--
-- Name: SEQUENCE returns_return_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.returns_return_id_seq TO anon;
GRANT ALL ON SEQUENCE public.returns_return_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.returns_return_id_seq TO service_role;


--
-- Name: TABLE sales_summary_view; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sales_summary_view TO anon;
GRANT ALL ON TABLE public.sales_summary_view TO authenticated;
GRANT ALL ON TABLE public.sales_summary_view TO service_role;


--
-- Name: TABLE store_deletion_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.store_deletion_requests TO anon;
GRANT ALL ON TABLE public.store_deletion_requests TO authenticated;
GRANT ALL ON TABLE public.store_deletion_requests TO service_role;


--
-- Name: SEQUENCE store_deletion_requests_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.store_deletion_requests_id_seq TO anon;
GRANT ALL ON SEQUENCE public.store_deletion_requests_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.store_deletion_requests_id_seq TO service_role;


--
-- Name: TABLE top_selling_products; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.top_selling_products TO anon;
GRANT ALL ON TABLE public.top_selling_products TO authenticated;
GRANT ALL ON TABLE public.top_selling_products TO service_role;


--
-- Name: SEQUENCE transaction_payment_transasction_payment_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.transaction_payment_transasction_payment_id_seq TO anon;
GRANT ALL ON SEQUENCE public.transaction_payment_transasction_payment_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.transaction_payment_transasction_payment_id_seq TO service_role;


--
-- Name: TABLE transaction_payment; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.transaction_payment TO anon;
GRANT ALL ON TABLE public.transaction_payment TO authenticated;
GRANT ALL ON TABLE public.transaction_payment TO service_role;


--
-- Name: SEQUENCE user_type_user_type_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.user_type_user_type_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_type_user_type_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_type_user_type_id_seq TO service_role;


--
-- Name: TABLE user_type; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_type TO anon;
GRANT ALL ON TABLE public.user_type TO authenticated;
GRANT ALL ON TABLE public.user_type TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict zVddKKqCOAk48iEuxWQhCXKdQ3D2LQRHgUFbLhzWRvU2gLvf3aWN9wogGHiYA1a

