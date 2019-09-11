-- check gtfs reference for further documentation
-- https://developers.google.com/transit/gtfs/reference/#agencytxt

-- check Sqlite type affinity for more info on automatic type coercion
-- https://www.sqlite.org/draft/datatype3.html

pragma foreign_keys=on;


create table if not exists levels (
    level_id integer primary key,
    level_index float not null,
    level_name text
);


create table feed_info (
  feed_publisher_name text not null,
  feed_publisher_url text not null,
  feed_lang text not null,
  feed_start_date text,
  feed_end_date text,
  feed_version text,
  feed_contact_email text,
  feed_contact_url text,

  constraint valid_start_date check (feed_start_date = strftime('%Y%m%d', feed_start_date)),
  constraint valid_end_date check (feed_end_date = strftime('%Y%m%d', feed_end_date))
);


create table if not exists calendar (
    service_id integer primary key,
    monday integer not null,
    tuesday integer not null,
    wednesday integer not null,
    thursday integer not null,
    friday integer not null,
    saturday integer not null,
    sunday integer not null,
    start_date text not null,
    end_date text not null,

    constraint monday check (monday in (0, 1)),
    constraint tueday check (monday in (0, 1)),
    constraint wednesday check (monday in (0, 1)),
    constraint thursday check (monday in (0, 1)),
    constraint friday check (monday in (0, 1)),
    constraint saturday check (monday in (0, 1)),
    constraint sunday check (monday in (0, 1)),

    constraint valid_start_date check (start_date = strftime('%Y%m%d', start_date)),
    constraint valid_end_date check (end_date = strftime('%Y%m%d', end_date)),
    constraint consistent_dates check (strftime('%Y%m%d', end_date) > strftime('%Y%m%d', start_date) > 0)
);


create table if not exists calendar_dates (
    service_id integer not null references calendar,
    "date" text not null,
    exception_type integer not null,

    primary key (service_id, "date"),

    constraint exception_type_enum check (exception_type in (1, 2)),
    constraint date_value check ("date" > 0),
    constraint valid_date check ("date" = strftime('%Y%m%d', "date"))
);


-- https://developers.google.com/transit/gtfs/reference/#agencytxt
create table if not exists agency (
    -- conditionally required -> default only valid for single agency feed
    agency_id integer primary key default 'default',
    agency_name text  not null,
    agency_url text not null,
    agency_timezone text not null,
    agency_lang text,
    agency_phone text,
    agency_fare_url text,
    agency_email text
);


create table if not exists shapes (
  shape_id integer not null,
  shape_pt_lat float not null,
  shape_pt_lon float not null,
  shape_pt_sequence int not null,
  shape_dist_traveled float,

  primary key (shape_id, shape_pt_sequence),

  constraint latitude_WGS84 check (shape_pt_lat >= -90.0 and shape_pt_lat <= 90.0),
  constraint longitude_WGS84 check (shape_pt_lon >= -180.0 and shape_pt_lon <= 180.0),
  constraint non_negative_shape_sequence check (shape_pt_sequence > 0),
  constraint non_negative_shape_dist_traveled check (shape_dist_traveled > 0)
);


create table if not exists fare_attributes (
    fare_id integer primary key,
    price float not null,
    currency_type text not null,
    payment_method integer not null,
    transfers integer,
    agency_id integer references agency, -- tricky validation
    transfer_duration integer,

    constraint non_negative_price check (price > 0),
    constraint payment_method_enum check (payment_method in (0, 1)),
    constraint transfer_enum check (transfers in (0, 1, 2, null)),
    constraint non_negative_transfer_duration check (transfer_duration > 0)
);


create table if not exists routes (
    route_id integer primary key,
    agency_id integer not null references agency,
    route_short_name text,
    route_long_name text,
    route_desc text,
    route_type integer not null,
    route_url text,
    route_color text default 'FFFFFF',
    route_text_color text default '000000',
    route_sort_order integer

    constraint name check (route_short_name != null or route_long_name != null),
    constraint route_type_enum check (route_type in (0, 1, 2, 3, 4, 5, 6, 7)),
    constraint positive_sort_order check (route_sort_order >= 0)
);


-- https://developers.google.com/transit/gtfs/reference/#stopstxt
create table if not exists stops (
    stop_id integer primary key,
    stop_code text,
    stop_name text, -- conditionally required
    stop_desc text not null,
    stop_lat float, -- conditionally required
    stop_lon float, -- conditionally required
    zone_id integer, -- conditionally required ... todo
    stop_url text,
    location_type integer default 0,
    parent_station integer references stops,
    stop_timezone text, -- tricky rules
    wheelchair_boarding integer default 0,
    level_id integer references levels,
    platform_code text,

    constraint latitude_WGS84 check (stop_lat >= -90.0 and stop_lon <= 90.0),
    constraint longitude_WGS84 check (stop_lon >= -180.0 and stop_lon <= 180.0),
    -- stop/platform, station, entrace/exit, node, boarding area.
    constraint location_type_enum check (location_type in (0, 1, 2, 3, 4)),
    constraint conditional_stop_name check (location_type in (3, 4) or
                                           (location_type in (0, 1, 2) and
                                            stop_name != null)),
    constraint conditional_stop_lat check (location_type in (3, 4) or
                                           (location_type in (0, 1, 2) and
                                            stop_lat != null)),
    constraint conditional_stop_lon check (location_type in (3, 4) or
                                           (location_type in (0, 1, 2) and
                                            stop_lon != null)),
    constraint parent_relationship check ((location_type = 1 and parent_station = null) or
                                          (location_type = 0 and parent_station != null) or
                                          (location_type = 0 and parent_station = null)),
    constraint wheelchair_boarding_enum check (wheelchair_boarding in (0, 1, 2))
);

create table if not exists transfers (
  from_stop_id integer not null references stops,
  to_stop_id integer not null references stops,
  transfer_type integer not null,
  min_transfer_time integer,

  primary key (from_stop_id, to_stop_id),

  constraint transfer_type_enum check (transfer_type in (0, 1, 2, 3)),
  constraint non_negative_min_transfer_time check (min_transfer_time > 0)
);

create table if not exists fare_rules (
  fare_id integer references fare_attributes,
  route_id integer references routes,
  origin_id integer, --references stops.zone_id
  destination_id integer, --references stops.zone_id
  contains_id integer
);


create table if not exists trips (
    route_id integer not null references routes,
    service_id integer not null references calendar,
    trip_id integer primary key,
    trip_headsign text,
    trip_short_name text,
    direction_id integer,
    block_id integer,
    shape_id integer references shapes,
    wheelchair_accessible integer,
    bikes_allowed integer,

    constraint direction_id_enum check (direction_id in (0, 1)),
    constraint wheelchair_accessible_enum check (wheelchair_accessible in (0, 1, 2)),
    constraint bikes_allowed_enum check (bikes_allowed in (0, 1, 2))
);


create table if not exists stop_times (
    trip_id integer not null references trips,
    arrival_time text,-- can be null/empty .... tricky validation
    departure_time text, -- can be null/empty .... tricky validation
    stop_id integer not null references stops,
    stop_sequence integer not null,
    stop_headsign text,
    pickup_type integer default 0,
    drop_off_type integer default 0,
    shape_dist_traveled float,
    timepoint integer,

    primary key (trip_id, stop_id, arrival_time),

    constraint non_negative_arrival_time check (arrival_time = strftime('%Y%m%d', arrival_time)),
    constraint non_negative_arrival_time check (departure_time = strftime('%Y%m%d', departure_time)),
    constraint consistent_times check (departure_time >  arrival_time),
    constraint non_negative_stop_sequence check (stop_sequence > 0),
    constraint pickup_type_enum check (pickup_type in (0, 1, 2, 3)),
    constraint drop_off_type_enum check (drop_off_type in (0, 1, 2, 3)),
    constraint non_negative_shape_dist_traveled check (shape_dist_traveled >= 0),
    constraint timepoint_enum check (timepoint in (0, 1))
);


create table if not exists frequencies (
  trip_id integer references trips,
  start_time text not null,
  end_time text not null,
  headway_secs integer not null,
  exact_times integer,

  primary key (trip_id, start_time),

  constraint non_negative_start_time check (start_time = strftime('%H:%M:%S', start_time)),
  constraint non_negative_end_time check (end_time = strftime('%H:%M:%S', end_time)),
  constraint consistent_times check (end_time > start_time),
  constraint non_negative_headway_secs check (headway_secs > 0),
  constraint exact_times_enum check (exact_times in (0, 1))
);


create table if not exists pathways (
  pathway_id integer not null,
  from_stop_id integer not null references stops,
  to_stop_id integer not null references stops,
  pathway_mode integer not null,
  is_bidirectional integer not null,
  length float,
  traversal_time integer,
  stair_count integer,
  max_slope integer,
  min_width float,
  signposted_as text,
  reversed_signposted text

  constraint pathway_mode_enum check (pathway_mode in (0, 1, 2, 3, 4, 5, 6, 7))
  constraint is_bidirectional_enum check (is_bidirectional in (0, 1)),
  constraint non_negative_length check (length > 0),
  constraint positive_traversal_time check (traversal_time > 0),
  constraint non_null_stair_count check (stair_count != 0)
);
