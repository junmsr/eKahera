--
-- PostgreSQL database dump
--

\restrict DlckQMtLca0UeIG6S5PUoov9oPeF1uMM4yPo5baDVAcxSX4orQ6Yh43Y4indiJc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-28 18:49:40

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
-- TOC entry 245 (class 1255 OID 24769)
-- Name: enforce_business_user_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_business_user_admin() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM 1
    FROM public.users u
    JOIN public.user_type ut ON ut.user_type_id = u.user_type_id
    WHERE u.user_id = NEW.user_id
      AND ut.user_type_name IN ('admin','superadmin');

    IF NOT FOUND THEN
      RAISE EXCEPTION 'business.user_id must reference an admin or superadmin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_business_user_admin() OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 24605)
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
-- TOC entry 242 (class 1259 OID 24588)
-- Name: business; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business (
    business_id integer NOT NULL,
    user_id integer,
    business_name character varying(255) NOT NULL,
    business_type character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    business_address text NOT NULL,
    house_number character varying(100),
    mobile character varying(15) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.business OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16431)
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
-- TOC entry 243 (class 1259 OID 32879)
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
-- TOC entry 241 (class 1259 OID 24587)
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
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 241
-- Name: business_business_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_business_id_seq OWNED BY public.business.business_id;


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
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 220
-- Name: discounts_discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discounts_discount_id_seq OWNED BY public.discounts.discount_id;


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
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 222
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- TOC entry 223 (class 1259 OID 16401)
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    log_id integer NOT NULL,
    transaction_id integer,
    inventory_id integer,
    product_id integer,
    return_id integer,
    date_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    business_id integer
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16405)
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
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 224
-- Name: logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_log_id_seq OWNED BY public.logs.log_id;


--
-- TOC entry 225 (class 1259 OID 16406)
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    product_category_id integer NOT NULL,
    product_category_name character varying(50)
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16409)
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
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 226
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_categories_product_category_id_seq OWNED BY public.product_categories.product_category_id;


--
-- TOC entry 227 (class 1259 OID 16410)
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
    business_id integer
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16413)
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
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 228
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- TOC entry 229 (class 1259 OID 16414)
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
-- TOC entry 230 (class 1259 OID 16417)
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
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 230
-- Name: returned_items_returned_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returned_items_returned_items_id_seq OWNED BY public.returned_items.returned_items_id;


--
-- TOC entry 231 (class 1259 OID 16418)
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
-- TOC entry 232 (class 1259 OID 16421)
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
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 232
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
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 218
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_items_transaction_item_id_seq OWNED BY public.transaction_items.transaction_item_id;


--
-- TOC entry 233 (class 1259 OID 16426)
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
-- TOC entry 234 (class 1259 OID 16430)
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
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 234
-- Name: transaction_payment_transasction_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_payment_transasction_payment_id_seq OWNED BY public.transaction_payment.transasction_payment_id;


--
-- TOC entry 236 (class 1259 OID 16434)
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
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 236
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- TOC entry 237 (class 1259 OID 16435)
-- Name: user_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_type (
    user_type_id integer NOT NULL,
    user_type_name character varying(20)
);


ALTER TABLE public.user_type OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16438)
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
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 238
-- Name: user_type_user_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_type_user_type_id_seq OWNED BY public.user_type.user_type_id;


--
-- TOC entry 239 (class 1259 OID 16439)
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
-- TOC entry 240 (class 1259 OID 16442)
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
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4833 (class 2604 OID 24619)
-- Name: business business_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business ALTER COLUMN business_id SET DEFAULT nextval('public.business_business_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 24621)
-- Name: discounts discount_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts ALTER COLUMN discount_id SET DEFAULT nextval('public.discounts_discount_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 24622)
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 24623)
-- Name: logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN log_id SET DEFAULT nextval('public.logs_log_id_seq'::regclass);


--
-- TOC entry 4815 (class 2604 OID 24624)
-- Name: product_categories product_category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN product_category_id SET DEFAULT nextval('public.product_categories_product_category_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 24625)
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- TOC entry 4819 (class 2604 OID 24626)
-- Name: returned_items returned_items_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items ALTER COLUMN returned_items_id SET DEFAULT nextval('public.returned_items_returned_items_id_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 24627)
-- Name: returns return_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns ALTER COLUMN return_id SET DEFAULT nextval('public.returns_return_id_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 24620)
-- Name: transaction_items transaction_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items ALTER COLUMN transaction_item_id SET DEFAULT nextval('public.transaction_items_transaction_item_id_seq'::regclass);


--
-- TOC entry 4821 (class 2604 OID 24629)
-- Name: transaction_payment transasction_payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment ALTER COLUMN transasction_payment_id SET DEFAULT nextval('public.transaction_payment_transasction_payment_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 24630)
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 24631)
-- Name: user_type user_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_type ALTER COLUMN user_type_id SET DEFAULT nextval('public.user_type_user_type_id_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 24632)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5083 (class 0 OID 24588)
-- Dependencies: 242
-- Data for Name: business; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business (business_id, user_id, business_name, business_type, country, business_address, house_number, mobile, email, created_at, updated_at) FROM stdin;
8	12	qwerty	qwerty	qwerty	qwerty	qwerty	09123456789	rimis47454@iotrama.com	2025-08-28 16:37:00.967998+08	2025-08-28 16:37:00.967998+08
9	13	qwer	qwer	qwer	wer	qwer	09123456789	napok30878@evoxury.com	2025-08-28 18:46:15.055373+08	2025-08-28 18:46:15.055373+08
\.


--
-- TOC entry 5060 (class 0 OID 16393)
-- Dependencies: 219
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discounts (discount_id, discount_name, discount_percentage) FROM stdin;
\.


--
-- TOC entry 5062 (class 0 OID 16397)
-- Dependencies: 221
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (inventory_id, product_id, quantity_in_stock, updated_at, business_id) FROM stdin;
\.


--
-- TOC entry 5064 (class 0 OID 16401)
-- Dependencies: 223
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (log_id, transaction_id, inventory_id, product_id, return_id, date_time, business_id) FROM stdin;
\.


--
-- TOC entry 5066 (class 0 OID 16406)
-- Dependencies: 225
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (product_category_id, product_category_name) FROM stdin;
\.


--
-- TOC entry 5068 (class 0 OID 16410)
-- Dependencies: 227
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, product_category_id, product_name, cost_price, selling_price, sku, created_at, updated_at, created_by_user_id, business_id) FROM stdin;
\.


--
-- TOC entry 5070 (class 0 OID 16414)
-- Dependencies: 229
-- Data for Name: returned_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returned_items (returned_items_id, return_id, product_id, product_quantity) FROM stdin;
\.


--
-- TOC entry 5072 (class 0 OID 16418)
-- Dependencies: 231
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returns (return_id, transaction_id, date_returned, money_returned) FROM stdin;
\.


--
-- TOC entry 5058 (class 0 OID 16389)
-- Dependencies: 217
-- Data for Name: transaction_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_items (transaction_item_id, transaction_id, product_id, product_quantity, price_at_sale) FROM stdin;
\.


--
-- TOC entry 5074 (class 0 OID 16426)
-- Dependencies: 233
-- Data for Name: transaction_payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_payment (transasction_payment_id, user_id, discount_id, payment_type, money_received, money_change, transaction_date, transaction_id) FROM stdin;
\.


--
-- TOC entry 5076 (class 0 OID 16431)
-- Dependencies: 235
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (transaction_id, cashier_user_id, customer_user_id, total_amount, status, created_at, updated_at, business_id) FROM stdin;
\.


--
-- TOC entry 5078 (class 0 OID 16435)
-- Dependencies: 237
-- Data for Name: user_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_type (user_type_id, user_type_name) FROM stdin;
4	customer
1	superadmin
2	admin
3	cashier
\.


--
-- TOC entry 5080 (class 0 OID 16439)
-- Dependencies: 239
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, user_type_id, username, contact_number, email, password_hash, role, created_at, updated_at, business_id) FROM stdin;
12	2	toktok	09123456789	rimis47454@iotrama.com	$2b$10$5t7MCb7EiXrilxAzybYt8.h8fW22cVhB1l.77iHwgQLxnjg7j2p/y	business_owner	2025-08-28 16:37:00.967998+08	2025-08-28 18:06:58.527013+08	\N
13	2	napok	09123456789	napok30878@evoxury.com	$2b$10$3L8UaAVXm7elx3KXybBOvOrrSDG4DE7yRZzXNGzvx4wVn2RSUTlhm	business_owner	2025-08-28 18:46:15.055373+08	2025-08-28 18:46:15.055373+08	\N
\.


--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 241
-- Name: business_business_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_business_id_seq', 9, true);


--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 220
-- Name: discounts_discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discounts_discount_id_seq', 1, false);


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 222
-- Name: inventory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_inventory_id_seq', 1, false);


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 224
-- Name: logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_log_id_seq', 1, false);


--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 226
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_categories_product_category_id_seq', 1, false);


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 228
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_product_id_seq', 1, false);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 230
-- Name: returned_items_returned_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returned_items_returned_items_id_seq', 1, false);


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 232
-- Name: returns_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returns_return_id_seq', 1, false);


--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 218
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_items_transaction_item_id_seq', 1, false);


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 234
-- Name: transaction_payment_transasction_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_payment_transasction_payment_id_seq', 1, false);


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 236
-- Name: transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_transaction_id_seq', 1, false);


--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 238
-- Name: user_type_user_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_type_user_type_id_seq', 3, true);


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 13, true);


--
-- TOC entry 4877 (class 2606 OID 24616)
-- Name: business business_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_email_unique UNIQUE (email);


--
-- TOC entry 4879 (class 2606 OID 24597)
-- Name: business business_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_pkey PRIMARY KEY (business_id);


--
-- TOC entry 4842 (class 2606 OID 16459)
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (discount_id);


--
-- TOC entry 4844 (class 2606 OID 16461)
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- TOC entry 4846 (class 2606 OID 16463)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4848 (class 2606 OID 16465)
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_category_id);


--
-- TOC entry 4851 (class 2606 OID 16467)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4853 (class 2606 OID 16471)
-- Name: returned_items returned_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items
    ADD CONSTRAINT returned_items_pkey PRIMARY KEY (returned_items_id);


--
-- TOC entry 4855 (class 2606 OID 16473)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (return_id);


--
-- TOC entry 4840 (class 2606 OID 16457)
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (transaction_item_id);


--
-- TOC entry 4859 (class 2606 OID 16477)
-- Name: transaction_payment transaction_payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT transaction_payment_pkey PRIMARY KEY (transasction_payment_id);


--
-- TOC entry 4863 (class 2606 OID 16479)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 4865 (class 2606 OID 24702)
-- Name: user_type user_type_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_type
    ADD CONSTRAINT user_type_name_unique UNIQUE (user_type_name);


--
-- TOC entry 4867 (class 2606 OID 16481)
-- Name: user_type user_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_type
    ADD CONSTRAINT user_type_pkey PRIMARY KEY (user_type_id);


--
-- TOC entry 4871 (class 2606 OID 24614)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 4873 (class 2606 OID 16483)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4875 (class 2606 OID 24618)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4880 (class 1259 OID 24604)
-- Name: idx_business_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_email ON public.business USING btree (email);


--
-- TOC entry 4881 (class 1259 OID 24603)
-- Name: idx_business_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_user_id ON public.business USING btree (user_id);


--
-- TOC entry 4856 (class 1259 OID 24763)
-- Name: idx_payment_tx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx ON public.transaction_payment USING btree (transaction_id);


--
-- TOC entry 4857 (class 1259 OID 24764)
-- Name: idx_payment_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_user ON public.transaction_payment USING btree (user_id);


--
-- TOC entry 4849 (class 1259 OID 24723)
-- Name: idx_products_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_created_by ON public.products USING btree (created_by_user_id);


--
-- TOC entry 4837 (class 1259 OID 24748)
-- Name: idx_transaction_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transaction_items_product ON public.transaction_items USING btree (product_id);


--
-- TOC entry 4838 (class 1259 OID 24747)
-- Name: idx_transaction_items_tx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transaction_items_tx ON public.transaction_items USING btree (transaction_id);


--
-- TOC entry 4860 (class 1259 OID 24740)
-- Name: idx_transactions_cashier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_cashier ON public.transactions USING btree (cashier_user_id);


--
-- TOC entry 4861 (class 1259 OID 24741)
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- TOC entry 4868 (class 1259 OID 24609)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4869 (class 1259 OID 24610)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4910 (class 2620 OID 24770)
-- Name: business trg_enforce_business_user_admin; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_business_user_admin BEFORE INSERT OR UPDATE ON public.business FOR EACH ROW EXECUTE FUNCTION public.enforce_business_user_admin();


--
-- TOC entry 4911 (class 2620 OID 24612)
-- Name: business update_business_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_updated_at BEFORE UPDATE ON public.business FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4906 (class 2620 OID 24767)
-- Name: inventory update_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4907 (class 2620 OID 24607)
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4908 (class 2620 OID 24738)
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4909 (class 2620 OID 24611)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4905 (class 2606 OID 24598)
-- Name: business business_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business
    ADD CONSTRAINT business_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4882 (class 2606 OID 16486)
-- Name: transaction_items fk_cart_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT fk_cart_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4883 (class 2606 OID 16491)
-- Name: transaction_items fk_cart_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT fk_cart_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4884 (class 2606 OID 32884)
-- Name: inventory fk_inventory_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4885 (class 2606 OID 16496)
-- Name: inventory fk_inventory_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4886 (class 2606 OID 32889)
-- Name: logs fk_logs_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4887 (class 2606 OID 16506)
-- Name: logs fk_logs_inventory_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_inventory_id FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4888 (class 2606 OID 16511)
-- Name: logs fk_logs_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4889 (class 2606 OID 16521)
-- Name: logs fk_logs_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_logs_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 32874)
-- Name: products fk_products_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4892 (class 2606 OID 24713)
-- Name: products fk_products_created_by_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4896 (class 2606 OID 16526)
-- Name: returns fk_return_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT fk_return_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4894 (class 2606 OID 16531)
-- Name: returned_items fk_returned_items_product_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items
    ADD CONSTRAINT fk_returned_items_product_id FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4895 (class 2606 OID 16536)
-- Name: returned_items fk_returned_items_return_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_items
    ADD CONSTRAINT fk_returned_items_return_id FOREIGN KEY (return_id) REFERENCES public.returns(return_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4897 (class 2606 OID 16541)
-- Name: transaction_payment fk_transaction_payment_discount_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_discount_id FOREIGN KEY (discount_id) REFERENCES public.discounts(discount_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4898 (class 2606 OID 24754)
-- Name: transaction_payment fk_transaction_payment_transaction_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 24749)
-- Name: transaction_payment fk_transaction_payment_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_payment
    ADD CONSTRAINT fk_transaction_payment_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4900 (class 2606 OID 32869)
-- Name: transactions fk_transactions_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4901 (class 2606 OID 24728)
-- Name: transactions fk_transactions_cashier_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_cashier_user_id FOREIGN KEY (cashier_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4902 (class 2606 OID 24733)
-- Name: transactions fk_transactions_customer_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_customer_user_id FOREIGN KEY (customer_user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4903 (class 2606 OID 32894)
-- Name: users fk_users_business; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_business FOREIGN KEY (business_id) REFERENCES public.business(business_id);


--
-- TOC entry 4904 (class 2606 OID 16551)
-- Name: users fk_users_user_type_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_user_type_id FOREIGN KEY (user_type_id) REFERENCES public.user_type(user_type_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4890 (class 2606 OID 16556)
-- Name: logs logs_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(return_id);


--
-- TOC entry 4893 (class 2606 OID 16561)
-- Name: products products_product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_category_id_fkey FOREIGN KEY (product_category_id) REFERENCES public.product_categories(product_category_id);


-- Completed on 2025-08-28 18:49:40

--
-- PostgreSQL database dump complete
--

\unrestrict DlckQMtLca0UeIG6S5PUoov9oPeF1uMM4yPo5baDVAcxSX4orQ6Yh43Y4indiJc

