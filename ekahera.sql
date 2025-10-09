--
-- PostgreSQL database dump
--

\restrict pmaPC1cSX6iqhat98wM2hOOww2g2jDm91mNqeElJqpxdWSHjRSfgT2suvYeQGgE

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-08 20:34:27

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
-- TOC entry 251 (class 1255 OID 32989)
-- Name: enforce_business_user_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_business_user_admin() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- No enforcement needed because ownership is via users.business_id
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_business_user_admin() OWNER TO postgres;

--
-- TOC entry 250 (class 1255 OID 24605)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 24588)
-- Name: business; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business (
    business_id integer NOT NULL,
    business_name character varying(255) NOT NULL,
    business_type character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
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
    CONSTRAINT check_business_verification_status CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'repass'::character varying])::text[])))
);


ALTER TABLE public.business OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16431)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    cashier_user_id integer,
    customer_user_id integer,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id integer
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 32879)
-- Name: admin_dashboard_sales; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.admin_dashboard_sales AS
 SELECT b.business_id,
    b.business_name,
    sum(t.total_amount) AS total_sales,
    count(t.transaction_id) AS total_transactions
   FROM (public.business b
     LEFT JOIN public.transactions t ON ((b.business_id = t.business_id)))
  GROUP BY b.business_id, b.business_name;


ALTER VIEW public.admin_dashboard_sales OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 24587)
-- Name: business_business_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_business_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_business_id_seq OWNER TO postgres;

--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 239
-- Name: business_business_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_business_id_seq OWNED BY public.business.business_id;


--
-- TOC entry 245 (class 1259 OID 41192)
-- Name: business_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_documents (
    document_id integer NOT NULL,
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
    CONSTRAINT check_document_verification_status CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'repass'::character varying])::text[])))
);


ALTER TABLE public.business_documents OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 41191)
-- Name: business_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_documents_document_id_seq OWNER TO postgres;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 244
-- Name: business_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_documents_document_id_seq OWNED BY public.business_documents.document_id;


--
-- TOC entry 237 (class 1259 OID 16439)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    user_type_id integer,
    username character varying(50) NOT NULL,
    contact_number character varying(11),
    email character varying(255),
    password_hash character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    business_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 41246)
-- Name: business_verification_summary; Type: VIEW; Schema: public; Owner: postgres
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
        END) AS pending_documents,
    count(
        CASE
            WHEN ((bd.verification_status)::text = 'repass'::text) THEN 1
            ELSE NULL::integer
        END) AS repass_documents
   FROM ((public.business b
     LEFT JOIN public.business_documents bd ON ((b.business_id = bd.business_id)))
     LEFT JOIN public.users u ON ((b.verification_reviewed_by = u.user_id)))
  GROUP BY b.business_id, b.business_name, b.business_type, b.email, b.verification_status, b.verification_submitted_at, b.verification_reviewed_at, u.username;


ALTER VIEW public.business_verification_summary OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16393)
-- Name: discounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discounts (
    discount_id integer NOT NULL,
    discount_name character varying(20),
    discount_percentage numeric(10,2)
);


ALTER TABLE public.discounts OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16396)
-- Name: discounts_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discounts_discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discounts_discount_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 220
-- Name: discounts_discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discounts_discount_id_seq OWNED BY public.discounts.discount_id;


--
-- TOC entry 247 (class 1259 OID 41214)
-- Name: email_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_notifications (
    notification_id integer NOT NULL,
    recipient_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    notification_type character varying(100) NOT NULL,
    business_id integer,
    user_id integer,
    sent_at timestamp with time zone DEFAULT now(),
    status character varying(50) DEFAULT 'sent'::character varying
);


ALTER TABLE public.email_notifications OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 41213)
-- Name: email_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_notifications_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 246
-- Name: email_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_notifications_notification_id_seq OWNED BY public.email_notifications.notification_id;


--
-- TOC entry 221 (class 1259 OID 16397)
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    inventory_id integer NOT NULL,
    product_id integer,
    quantity_in_stock integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id integer,
    CONSTRAINT inventory_quantity_nonneg CHECK ((quantity_in_stock >= 0))
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16400)
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_inventory_id_seq OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 222
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- TOC entry 243 (class 1259 OID 32994)
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    log_id integer NOT NULL,
    user_id integer NOT NULL,
    business_id integer NOT NULL,
    action text NOT NULL,
    date_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 32993)
-- Name: logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 242
-- Name: logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_log_id_seq OWNED BY public.logs.log_id;


--
-- TOC entry 249 (class 1259 OID 41251)
-- Name: pending_verifications; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pending_verifications AS
 SELECT b.business_id,
    b.business_name,
    b.business_type,
    b.email,
    b.mobile,
    b.business_address,
    b.country,
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
  GROUP BY b.business_id, b.business_name, b.business_type, b.email, b.mobile, b.business_address, b.country, b.verification_submitted_at
  ORDER BY b.verification_submitted_at;


ALTER VIEW public.pending_verifications OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16406)
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    product_category_id integer NOT NULL,
    product_category_name character varying(50)
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16409)
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_categories_product_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_categories_product_category_id_seq OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 224
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_categories_product_category_id_seq OWNED BY public.product_categories.product_category_id;


--
-- TOC entry 225 (class 1259 OID 16410)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    product_category_id integer,
    product_name character varying(50),
    cost_price numeric(10,2),
    selling_price numeric(10,2),
    sku character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by_user_id integer,
    business_id integer,
    description text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16413)
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_product_id_seq OWNER TO postgres;

--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 226
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- TOC entry 227 (class 1259 OID 16414)
-- Name: returned_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returned_items (
    returned_items_id integer NOT NULL,
    return_id integer,
    product_id integer,
    product_quantity integer
);


ALTER TABLE public.returned_items OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16417)
-- Name: returned_items_returned_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.returned_items_returned_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returned_items_returned_items_id_seq OWNER TO postgres;

--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 228
-- Name: returned_items_returned_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returned_items_returned_items_id_seq OWNED BY public.returned_items.returned_items_id;


--
-- TOC entry 229 (class 1259 OID 16418)
-- Name: returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returns (
    return_id integer NOT NULL,
    transaction_id integer,
    date_returned date,
    money_returned numeric(10,2)
);


ALTER TABLE public.returns OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16421)
-- Name: returns_return_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.returns_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returns_return_id_seq OWNER TO postgres;

--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 230
-- Name: returns_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returns_return_id_seq OWNED BY public.returns.return_id;


--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_items (
    transaction_item_id integer NOT NULL,
    transaction_id integer,
    product_id integer,
    product_quantity integer,
    price_at_sale numeric(12,2),
    subtotal numeric(12,2) GENERATED ALWAYS AS (((COALESCE(product_quantity, 0))::numeric * COALESCE(price_at_sale, (0)::numeric))) STORED
);


ALTER TABLE public.transaction_items OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16392)
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_items_transaction_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_items_transaction_item_id_seq OWNER TO postgres;

--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 218
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_items_transaction_item_id_seq OWNED BY public.transaction_items.transaction_item_id;


--
-- TOC entry 231 (class 1259 OID 16426)
-- Name: transaction_payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_payment (
    transasction_payment_id integer NOT NULL,
    user_id integer,
    discount_id integer,
    payment_type character varying(20) NOT NULL,
    money_received numeric(10,2),
    money_change numeric(10,2),
    transaction_date date DEFAULT CURRENT_DATE NOT NULL,
    transaction_id integer
);


ALTER TABLE public.transaction_payment OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16430)
-- Name: transaction_payment_transasction_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_payment_transasction_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_payment_transasction_payment_id_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 232
-- Name: transaction_payment_transasction_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_payment_transasction_payment_id_seq OWNED BY public.transaction_payment.transasction_payment_id;


--
-- TOC entry 234 (class 1259 OID 16434)
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_transaction_id_seq OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 234
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- TOC entry 235 (class 1259 OID 16435)
-- Name: user_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_type (
    user_type_id integer NOT NULL,
    user_type_name character varying(20)
);


ALTER TABLE public.user_type OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16438)
-- Name: user_type_user_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_type_user_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_type_user_type_id_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 236
-- Name: user_type_user_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_type_user_type_id_seq OWNED BY public.user_type.user_type_id;


--
-- TOC entry 238 (class 1259 OID 16442)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 238
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4849 (class 2604 OID 24619)
-- Name: business business_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business ALTER COLUMN business_id SET DEFAULT nextval('public.business_business_id_seq'::regclass);


--
-- TOC entry 4855 (class 2604 OID 41195)
-- Name: business_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_documents ALTER COLUMN document_id SET DEFAULT nextval('public.business_documents_document_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 24621)
-- Name: discounts discount_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts ALTER COLUMN discount_id SET DEFAULT nextval('public.discounts_discount_id_seq'::regclass);


--
-- TOC entry 4859 (class 2604 OID 41217)
-- Name: email_notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.email_notifications_notification_id_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 24622)
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- TOC entry 4853 (class 2604 OID 32997)
-- Name: logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN log_id SET DEFAULT nextval('public.logs_log_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 24624)
-- Name: product_categories product_category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN product_category_id SET DEFAULT nextval('public.product_categories_product_category_id_seq'::regclass);


--
-- TOC entry 4832 (class 2604 OID 24625)
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 24626)
-- Name: returned_items returned_items_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items ALTER COLUMN returned_items_id SET DEFAULT nextval('public.returned_items_returned_items_id_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 24627)
-- Name: returns return_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns ALTER COLUMN return_id SET DEFAULT nextval('public.returns_return_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 24620)
-- Name: transaction_items transaction_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items ALTER COLUMN transaction_item_id SET DEFAULT nextval('public.transaction_items_transaction_item_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 24629)
-- Name: transaction_payment transasction_payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment ALTER COLUMN transasction_payment_id SET DEFAULT nextval('public.transaction_payment_transasction_payment_id_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 24630)
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 24631)
-- Name: user_type user_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_type ALTER COLUMN user_type_id SET DEFAULT nextval('public.user_type_user_type_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 24632)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5125 (class 0 OID 24588)
-- Dependencies: 240
-- Data for Name: business; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business (business_id, business_name, business_type, country, business_address, house_number, mobile, email, created_at, updated_at, verification_status, verification_submitted_at, verification_reviewed_at, verification_reviewed_by, verification_rejection_reason, verification_resubmission_notes) FROM stdin;
5	qwer	qwer	qwer	qwer	qwer	09123456789	barovoc509@lespedia.com	2025-08-29 18:01:42.369496+08	2025-08-29 18:01:42.369496+08	pending	\N	\N	\N	\N	\N
6	adsf	asdf	asd	fasdf	asdfa	09123456789	sefola6477@lespedia.com	2025-09-02 14:25:09.897047+08	2025-09-02 14:25:09.897047+08	pending	\N	\N	\N	\N	\N
7	gebgab store	Grocery Store	Philippines	qwer	qwerqwer	09123456789	gebaga4613@etenx.com	2025-10-02 20:52:47.514667+08	2025-10-02 20:52:47.514667+08	pending	\N	\N	\N	\N	\N
8	asdf	Pharmacy	Philippines	fdas	afds	09123456789	fohoyec905@gddcorp.com	2025-10-02 21:00:33.617414+08	2025-10-02 21:00:33.617414+08	pending	\N	\N	\N	\N	\N
9	rexy store	Grocery Store	Philippines	qwer	qwer	09123456789	rexer25110@etenx.com	2025-10-02 21:13:24.554416+08	2025-10-02 21:13:24.554416+08	pending	\N	\N	\N	\N	\N
10	weyht	Grocery Store	Philippines	Mamplasan, Biñan, Laguna	qwerty	09123456789	weyiw81461@gddcorp.com	2025-10-02 21:30:21.821419+08	2025-10-02 21:30:21.821419+08	pending	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5129 (class 0 OID 41192)
-- Dependencies: 245
-- Data for Name: business_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_documents (document_id, business_id, document_type, document_name, file_path, file_size, mime_type, verification_status, verification_notes, verified_by, verified_at, uploaded_at, updated_at) FROM stdin;
1	9	Mayor's Permit	Archive_with_tar_guide.pdf	C:\\Users\\Darius\\Desktop\\Capstone\\eKahera\\backend\\uploads\\documents\\9-1759410804904-49851121.pdf	477995	application/pdf	pending	\N	\N	\N	2025-10-02 21:13:25.039472+08	2025-10-02 21:13:25.039472+08
2	9	BIR Certificate of Registration	L09.pdf	C:\\Users\\Darius\\Desktop\\Capstone\\eKahera\\backend\\uploads\\documents\\9-1759410804942-426546376.pdf	832910	application/pdf	pending	\N	\N	\N	2025-10-02 21:13:25.097869+08	2025-10-02 21:13:25.097869+08
3	9	Business Registration Certificate	objectives of eKahera.pdf	C:\\Users\\Darius\\Desktop\\Capstone\\eKahera\\backend\\uploads\\documents\\9-1759410804993-814359628.pdf	54213	application/pdf	pending	\N	\N	\N	2025-10-02 21:13:25.121288+08	2025-10-02 21:13:25.121288+08
4	10	Business Registration Certificate	L09.pdf	C:\\Users\\Darius\\Desktop\\Capstone\\eKahera\\backend\\uploads\\documents\\10-1759411822143-424940251.pdf	832910	application/pdf	pending	\N	\N	\N	2025-10-02 21:30:22.202344+08	2025-10-02 21:30:22.202344+08
5	10	Mayor's Permit	Archive_with_tar_guide.pdf	C:\\Users\\Darius\\Desktop\\Capstone\\eKahera\\backend\\uploads\\documents\\10-1759411822157-962878518.pdf	477995	application/pdf	pending	\N	\N	\N	2025-10-02 21:30:22.205666+08	2025-10-02 21:30:22.205666+08
6	10	BIR Certificate of Registration	objectives of eKahera.pdf	C:\\Users\\Darius\\Desktop\\Capstone\\eKahera\\backend\\uploads\\documents\\10-1759411822163-496727454.pdf	54213	application/pdf	pending	\N	\N	\N	2025-10-02 21:30:22.206685+08	2025-10-02 21:30:22.206685+08
\.


--
-- TOC entry 5104 (class 0 OID 16393)
-- Dependencies: 219
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discounts (discount_id, discount_name, discount_percentage) FROM stdin;
\.


--
-- TOC entry 5131 (class 0 OID 41214)
-- Dependencies: 247
-- Data for Name: email_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_notifications (notification_id, recipient_email, subject, message, notification_type, business_id, user_id, sent_at, status) FROM stdin;
\.


--
-- TOC entry 5106 (class 0 OID 16397)
-- Dependencies: 221
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (inventory_id, product_id, quantity_in_stock, updated_at, business_id) FROM stdin;
5	5	9	2025-10-02 16:00:41.647435+08	5
4	4	7	2025-10-02 16:19:02.012931+08	5
6	6	4	2025-10-02 16:30:38.545989+08	6
7	7	7	2025-10-02 16:30:38.545989+08	6
\.


--
-- TOC entry 5127 (class 0 OID 32994)
-- Dependencies: 243
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (log_id, user_id, business_id, action, date_time) FROM stdin;
1	8	5	Login	2025-09-12 21:08:01.169111
2	8	5	Delete product_id=2	2025-09-12 21:08:31.279031
3	8	5	Create product: knorr (SKU: 4808680230764)	2025-09-12 21:13:30.762413
4	8	5	Login	2025-09-12 21:55:22.290201
5	8	5	Login	2025-09-12 22:13:08.99275
6	8	5	Login	2025-09-17 22:21:59.360378
7	8	5	Checkout transaction_id=1 total=144	2025-09-17 22:51:05.096935
8	8	5	Checkout transaction_id=2 total=144	2025-09-17 22:51:38.171863
9	8	5	Login	2025-09-29 20:59:57.134196
10	8	5	Login	2025-09-29 21:20:05.786424
11	12	5	Login	2025-09-29 21:20:40.148097
12	12	5	Checkout transaction_id=3 total=144	2025-09-29 21:20:51.979026
13	8	5	Login	2025-09-30 22:21:48.036664
14	8	5	Login	2025-09-30 22:32:10.633623
15	8	5	Login	2025-09-30 23:17:09.766828
16	8	5	Add stock for product_id=5 (inventory_id=5)	2025-09-30 23:17:27.190668
17	8	5	Checkout transaction_id=4 total=144	2025-09-30 23:32:01.763502
18	8	5	Checkout transaction_id=5 total=144	2025-09-30 23:32:01.918209
19	8	5	Checkout transaction_id=7 total=144	2025-09-30 23:33:25.112558
20	8	5	Checkout transaction_id=6 total=144	2025-09-30 23:33:25.20793
21	8	5	Login	2025-10-02 15:52:02.535036
22	8	5	Add stock for product_id=4 (inventory_id=4)	2025-10-02 16:00:39.096448
23	8	5	Add stock for product_id=5 (inventory_id=5)	2025-10-02 16:00:41.67401
24	8	5	Checkout transaction_id=8 total=144	2025-10-02 16:01:30.476784
25	12	5	Login	2025-10-02 16:18:50.508796
26	12	5	Checkout transaction_id=9 total=144	2025-10-02 16:19:02.240305
27	10	6	Login	2025-10-02 16:22:10.800487
28	10	6	Create product: axer (SKU: 8851932349130)	2025-10-02 16:23:16.682019
29	10	6	Create product: knorrer (SKU: 4808680230764)	2025-10-02 16:23:47.71887
30	10	6	Checkout transaction_id=10 total=100	2025-10-02 16:24:12.037149
31	10	6	Checkout transaction_id=11 total=520	2025-10-02 16:25:22.305504
32	10	6	Checkout transaction_id=12 total=100	2025-10-02 16:30:04.922948
33	10	6	Checkout transaction_id=13 total=210	2025-10-02 16:30:38.692
34	8	5	Login	2025-10-02 16:33:07.124265
35	8	5	Login	2025-10-02 17:20:45.530722
36	8	5	Login	2025-10-02 17:30:14.611935
37	10	6	Login	2025-10-02 17:37:13.03231
38	8	5	Login	2025-10-02 19:55:20.98491
39	8	5	Login	2025-10-02 20:36:33.268381
40	14	7	Login	2025-10-02 20:53:03.630198
41	15	8	Login	2025-10-02 21:00:51.009915
\.


--
-- TOC entry 5108 (class 0 OID 16406)
-- Dependencies: 223
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (product_category_id, product_category_name) FROM stdin;
1	compliments
2	cologne
\.


--
-- TOC entry 5110 (class 0 OID 16410)
-- Dependencies: 225
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, product_category_id, product_name, cost_price, selling_price, sku, created_at, updated_at, created_by_user_id, business_id, description) FROM stdin;
4	2	axe	122.00	144.00	8851932349130	2025-08-31 13:57:02.404958+08	2025-08-31 13:57:02.404958+08	8	5	hgdf
5	1	knorr	123.00	144.00	4808680230764	2025-09-12 21:13:30.57244+08	2025-09-30 23:08:38.237008+08	8	5	qwe
6	2	axer	80.00	100.00	8851932349130	2025-10-02 16:23:16.499276+08	2025-10-02 16:23:16.499276+08	10	6	qwer
7	1	knorrer	80.00	110.00	4808680230764	2025-10-02 16:23:47.554366+08	2025-10-02 16:23:47.554366+08	10	6	hgdf
\.


--
-- TOC entry 5112 (class 0 OID 16414)
-- Dependencies: 227
-- Data for Name: returned_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returned_items (returned_items_id, return_id, product_id, product_quantity) FROM stdin;
\.


--
-- TOC entry 5114 (class 0 OID 16418)
-- Dependencies: 229
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returns (return_id, transaction_id, date_returned, money_returned) FROM stdin;
\.


--
-- TOC entry 5102 (class 0 OID 16389)
-- Dependencies: 217
-- Data for Name: transaction_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_items (transaction_item_id, transaction_id, product_id, product_quantity, price_at_sale) FROM stdin;
1	1	5	1	144.00
2	2	4	1	144.00
3	3	5	1	144.00
4	5	5	1	144.00
5	4	5	1	144.00
6	6	4	1	144.00
7	7	4	1	144.00
8	8	4	1	144.00
9	9	4	1	144.00
10	10	6	1	100.00
11	11	6	3	100.00
12	11	7	2	110.00
13	12	6	1	100.00
14	13	6	1	100.00
15	13	7	1	110.00
\.


--
-- TOC entry 5116 (class 0 OID 16426)
-- Dependencies: 231
-- Data for Name: transaction_payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_payment (transasction_payment_id, user_id, discount_id, payment_type, money_received, money_change, transaction_date, transaction_id) FROM stdin;
1	8	\N	cash	144.00	0.00	2025-09-17	1
2	8	\N	cash	144.00	0.00	2025-09-17	2
3	12	\N	cash	144.00	0.00	2025-09-29	3
4	8	\N	gcash	144.00	0.00	2025-09-30	5
5	8	\N	gcash	144.00	0.00	2025-09-30	4
6	8	\N	gcash	144.00	0.00	2025-09-30	6
7	8	\N	gcash	144.00	0.00	2025-09-30	7
8	8	\N	cash	200.00	56.00	2025-10-02	8
9	12	\N	cash	144.00	0.00	2025-10-02	9
10	10	\N	cash	100.00	0.00	2025-10-02	10
11	10	\N	cash	520.00	0.00	2025-10-02	11
12	10	\N	cash	200.00	100.00	2025-10-02	12
13	10	\N	cash	300.00	90.00	2025-10-02	13
\.


--
-- TOC entry 5118 (class 0 OID 16431)
-- Dependencies: 233
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (transaction_id, cashier_user_id, customer_user_id, total_amount, status, created_at, updated_at, business_id) FROM stdin;
1	8	\N	144.00	completed	2025-09-17 22:51:04.453559+08	2025-09-17 22:51:04.453559+08	5
2	8	\N	144.00	completed	2025-09-17 22:51:37.934555+08	2025-09-17 22:51:37.934555+08	5
3	12	\N	144.00	completed	2025-09-29 21:20:51.722773+08	2025-09-29 21:20:51.722773+08	5
5	8	\N	144.00	completed	2025-09-30 23:32:01.252254+08	2025-09-30 23:32:01.252254+08	5
4	8	\N	144.00	completed	2025-09-30 23:32:01.252824+08	2025-09-30 23:32:01.252824+08	5
6	8	\N	144.00	completed	2025-09-30 23:33:24.961737+08	2025-09-30 23:33:24.961737+08	5
7	8	\N	144.00	completed	2025-09-30 23:33:24.97704+08	2025-09-30 23:33:24.97704+08	5
8	8	\N	144.00	completed	2025-10-02 16:01:30.295893+08	2025-10-02 16:01:30.295893+08	5
9	12	\N	144.00	completed	2025-10-02 16:19:02.012931+08	2025-10-02 16:19:02.012931+08	5
10	10	\N	100.00	completed	2025-10-02 16:24:11.810831+08	2025-10-02 16:24:11.810831+08	6
11	10	\N	520.00	completed	2025-10-02 16:25:22.050597+08	2025-10-02 16:25:22.050597+08	6
12	10	\N	100.00	completed	2025-10-02 16:30:04.649041+08	2025-10-02 16:30:04.649041+08	6
13	10	\N	210.00	completed	2025-10-02 16:30:38.545989+08	2025-10-02 16:30:38.545989+08	6
\.


--
-- TOC entry 5120 (class 0 OID 16435)
-- Dependencies: 235
-- Data for Name: user_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_type (user_type_id, user_type_name) FROM stdin;
1	superadmin
2	admin
3	cashier
4	customer
\.


--
-- TOC entry 5122 (class 0 OID 16439)
-- Dependencies: 237
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, user_type_id, username, contact_number, email, password_hash, role, created_at, updated_at, business_id) FROM stdin;
8	2	bravo	09123456789	barovoc509@lespedia.com	$2b$10$nIAv0niohz.mHgbLeXO8iOA7.e8NalZGYySJV2guOjR5JjKeaoqs2	business_owner	2025-08-29 18:01:42.369496+08	2025-08-29 18:01:42.369496+08	5
10	2	sef	09123456789	sefola6477@lespedia.com	$2b$10$cNC1vueYBcaomTqdSlZbfePmEzWmFiDXrX8FWZ2YsKuibIEg/jBNK	business_owner	2025-09-02 14:25:09.897047+08	2025-09-02 14:25:09.897047+08	6
11	3	darius	09123456879	qwerty@asdfg	$2b$10$Ea5Up3Jz0YMUNufpXnrKbuqWo2JuOTxhuOFOdCuWTdcLUqaZ3l5UK	cashier	2025-09-03 17:36:43.054757+08	2025-09-03 17:36:43.054757+08	6
12	3	qwer	09876543219	asdf@gasd.com	$2b$10$DO2yxRHVJTJGNdhPUeke5ebM0CQVTR7sV2iYlaY.2dpLBKwQUzl7K	cashier	2025-09-10 18:43:03.161823+08	2025-09-10 18:43:03.161823+08	5
13	1	Daryl Mendina	\N	darylmendina@gmail.com	$2b$12$ku3I/XDI5KPElYV1zreds.Fkj7FoBWy6oB1FI3xtgUfZGRrfKG/Z6	superadmin	2025-10-02 18:55:21.768614+08	2025-10-02 18:55:21.768614+08	\N
14	2	gab	09123456789	gebaga4613@etenx.com	$2b$10$sZgfMAPdBpNKBFN3DEgqLOIVoFFr8GJSjCzUOv9Ltctc22tIUJqBC	business_owner	2025-10-02 20:52:47.514667+08	2025-10-02 20:52:47.514667+08	7
15	2	asdf	09123456789	fohoyec905@gddcorp.com	$2b$10$bxCvBzy1GZz67nHl3BUUEu65o8K7LImMqzzm8MLFTNm7oDgpBKSWW	business_owner	2025-10-02 21:00:33.617414+08	2025-10-02 21:00:33.617414+08	8
16	2	rex	09123456789	rexer25110@etenx.com	$2b$10$RwMRkIbkt.5ZL3/Lo7s2guUZG3.j7dU42qSxqHnerikfVJgqyhRIq	business_owner	2025-10-02 21:13:24.554416+08	2025-10-02 21:13:24.554416+08	9
17	2	wey	09123456789	weyiw81461@gddcorp.com	$2b$10$4fMS4YIrGkei3tJQjKRrR.AUMGKUWRlJBpjkqmhYltJzmkI.taTWm	business_owner	2025-10-02 21:30:21.821419+08	2025-10-02 21:30:21.821419+08	10
\.


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 239
-- Name: business_business_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_business_id_seq', 10, true);


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 244
-- Name: business_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_documents_document_id_seq', 6, true);


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 220
-- Name: discounts_discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discounts_discount_id_seq', 1, false);


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 246
-- Name: email_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_notifications_notification_id_seq', 1, false);


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 222
-- Name: inventory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_inventory_id_seq', 7, true);


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 242
-- Name: logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_log_id_seq', 41, true);


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 224
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_categories_product_category_id_seq', 3, true);


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 226
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_product_id_seq', 7, true);


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 228
-- Name: returned_items_returned_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returned_items_returned_items_id_seq', 1, false);


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 230
-- Name: returns_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returns_return_id_seq', 1, false);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 218
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_items_transaction_item_id_seq', 15, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 232
-- Name: transaction_payment_transasction_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_payment_transasction_payment_id_seq', 13, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 234
-- Name: transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_transaction_id_seq', 13, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 236
-- Name: user_type_user_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_type_user_type_id_seq', 4, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 238
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 17, true);


--
-- TOC entry 4913 (class 2606 OID 41202)
-- Name: business_documents business_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_documents
    ADD CONSTRAINT business_documents_pkey PRIMARY KEY (document_id);


--
-- TOC entry 4904 (class 2606 OID 24616)
-- Name: business business_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_email_unique UNIQUE (email);


--
-- TOC entry 4906 (class 2606 OID 24597)
-- Name: business business_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_pkey PRIMARY KEY (business_id);


--
-- TOC entry 4871 (class 2606 OID 16459)
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (discount_id);


--
-- TOC entry 4918 (class 2606 OID 41223)
-- Name: email_notifications email_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 4873 (class 2606 OID 16461)
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- TOC entry 4911 (class 2606 OID 33002)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4875 (class 2606 OID 16465)
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_category_id);


--
-- TOC entry 4878 (class 2606 OID 16467)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4880 (class 2606 OID 16471)
-- Name: returned_items returned_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items
    ADD CONSTRAINT returned_items_pkey PRIMARY KEY (returned_items_id);


--
-- TOC entry 4882 (class 2606 OID 16473)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (return_id);


--
-- TOC entry 4869 (class 2606 OID 16457)
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (transaction_item_id);


--
-- TOC entry 4886 (class 2606 OID 16477)
-- Name: transaction_payment transaction_payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT transaction_payment_pkey PRIMARY KEY (transasction_payment_id);


--
-- TOC entry 4890 (class 2606 OID 16479)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 4892 (class 2606 OID 24702)
-- Name: user_type user_type_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_type
    ADD CONSTRAINT user_type_name_unique UNIQUE (user_type_name);


--
-- TOC entry 4894 (class 2606 OID 16481)
-- Name: user_type user_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_type
    ADD CONSTRAINT user_type_pkey PRIMARY KEY (user_type_id);


--
-- TOC entry 4898 (class 2606 OID 24614)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 4900 (class 2606 OID 16483)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4902 (class 2606 OID 24618)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4914 (class 1259 OID 41234)
-- Name: idx_business_documents_business_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_documents_business_id ON public.business_documents USING btree (business_id);


--
-- TOC entry 4915 (class 1259 OID 41236)
-- Name: idx_business_documents_uploaded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_documents_uploaded_at ON public.business_documents USING btree (uploaded_at);


--
-- TOC entry 4916 (class 1259 OID 41235)
-- Name: idx_business_documents_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_documents_verification_status ON public.business_documents USING btree (verification_status);


--
-- TOC entry 4907 (class 1259 OID 24604)
-- Name: idx_business_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_email ON public.business USING btree (email);


--
-- TOC entry 4908 (class 1259 OID 41237)
-- Name: idx_business_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_verification_status ON public.business USING btree (verification_status);


--
-- TOC entry 4909 (class 1259 OID 41238)
-- Name: idx_business_verification_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_verification_submitted_at ON public.business USING btree (verification_submitted_at);


--
-- TOC entry 4919 (class 1259 OID 41239)
-- Name: idx_email_notifications_business_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_notifications_business_id ON public.email_notifications USING btree (business_id);


--
-- TOC entry 4920 (class 1259 OID 41241)
-- Name: idx_email_notifications_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_notifications_sent_at ON public.email_notifications USING btree (sent_at);


--
-- TOC entry 4921 (class 1259 OID 41240)
-- Name: idx_email_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_notifications_type ON public.email_notifications USING btree (notification_type);


--
-- TOC entry 4883 (class 1259 OID 24763)
-- Name: idx_payment_tx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx ON public.transaction_payment USING btree (transaction_id);


--
-- TOC entry 4884 (class 1259 OID 24764)
-- Name: idx_payment_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_user ON public.transaction_payment USING btree (user_id);


--
-- TOC entry 4876 (class 1259 OID 24723)
-- Name: idx_products_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_created_by ON public.products USING btree (created_by_user_id);


--
-- TOC entry 4866 (class 1259 OID 24748)
-- Name: idx_transaction_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transaction_items_product ON public.transaction_items USING btree (product_id);


--
-- TOC entry 4867 (class 1259 OID 24747)
-- Name: idx_transaction_items_tx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transaction_items_tx ON public.transaction_items USING btree (transaction_id);


--
-- TOC entry 4887 (class 1259 OID 24740)
-- Name: idx_transactions_cashier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_cashier ON public.transactions USING btree (cashier_user_id);


--
-- TOC entry 4888 (class 1259 OID 24741)
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- TOC entry 4895 (class 1259 OID 24609)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4896 (class 1259 OID 24610)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4951 (class 2620 OID 32990)
-- Name: business trg_enforce_business_user_admin; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_business_user_admin BEFORE INSERT OR UPDATE ON public.business FOR EACH ROW EXECUTE FUNCTION public.enforce_business_user_admin();


--
-- TOC entry 4953 (class 2620 OID 41242)
-- Name: business_documents update_business_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_documents_updated_at BEFORE UPDATE ON public.business_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4952 (class 2620 OID 24612)
-- Name: business update_business_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_updated_at BEFORE UPDATE ON public.business FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4947 (class 2620 OID 24767)
-- Name: inventory update_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4948 (class 2620 OID 24607)
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4949 (class 2620 OID 24738)
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4950 (class 2620 OID 24611)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4943 (class 2606 OID 41203)
-- Name: business_documents business_documents_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_documents
    ADD CONSTRAINT business_documents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business(business_id) ON DELETE CASCADE;


--
-- TOC entry 4944 (class 2606 OID 41208)
-- Name: business_documents business_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_documents
    ADD CONSTRAINT business_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(user_id);


--
-- TOC entry 4940 (class 2606 OID 41186)
-- Name: business business_verification_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_verification_reviewed_by_fkey FOREIGN KEY (verification_reviewed_by) REFERENCES public.users(user_id);


--
-- TOC entry 4945 (class 2606 OID 41224)
-- Name: email_notifications email_notifications_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4946 (class 2606 OID 41229)
-- Name: email_notifications email_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4922 (class 2606 OID 16486)
-- Name: transaction_items fk_cart_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT fk_cart_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4923 (class 2606 OID 16491)
-- Name: transaction_items fk_cart_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT fk_cart_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 32884)
-- Name: inventory fk_inventory_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4925 (class 2606 OID 16496)
-- Name: inventory fk_inventory_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4941 (class 2606 OID 33008)
-- Name: logs fk_logs_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4942 (class 2606 OID 33003)
-- Name: logs fk_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4926 (class 2606 OID 32874)
-- Name: products fk_products_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4927 (class 2606 OID 24713)
-- Name: products fk_products_created_by_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4931 (class 2606 OID 16526)
-- Name: returns fk_return_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT fk_return_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4929 (class 2606 OID 16531)
-- Name: returned_items fk_returned_items_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items
    ADD CONSTRAINT fk_returned_items_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 16536)
-- Name: returned_items fk_returned_items_return_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items
    ADD CONSTRAINT fk_returned_items_return_id FOREIGN KEY (return_id) REFERENCES public.returns(return_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 16541)
-- Name: transaction_payment fk_transaction_payment_discount_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_discount_id FOREIGN KEY (discount_id) REFERENCES public.discounts(discount_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4933 (class 2606 OID 24754)
-- Name: transaction_payment fk_transaction_payment_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 24749)
-- Name: transaction_payment fk_transaction_payment_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4935 (class 2606 OID 32869)
-- Name: transactions fk_transactions_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4936 (class 2606 OID 24728)
-- Name: transactions fk_transactions_cashier_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_cashier_user_id FOREIGN KEY (cashier_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4937 (class 2606 OID 24733)
-- Name: transactions fk_transactions_customer_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_customer_user_id FOREIGN KEY (customer_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4938 (class 2606 OID 32930)
-- Name: users fk_users_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_business FOREIGN KEY (business_id) REFERENCES public.business(business_id) ON DELETE CASCADE;


--
-- TOC entry 4939 (class 2606 OID 16551)
-- Name: users fk_users_user_type_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_user_type_id FOREIGN KEY (user_type_id) REFERENCES public.user_type(user_type_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 16561)
-- Name: products products_product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_category_id_fkey FOREIGN KEY (product_category_id) REFERENCES public.product_categories(product_category_id);


-- Completed on 2025-10-08 20:34:28

--
-- PostgreSQL database dump complete
--

\unrestrict pmaPC1cSX6iqhat98wM2hOOww2g2jDm91mNqeElJqpxdWSHjRSfgT2suvYeQGgE

