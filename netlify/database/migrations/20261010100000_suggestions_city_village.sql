-- Every suggestion records its city or district and its village, so we build up a list of every village we reach.
ALTER TABLE suggestions ADD COLUMN city TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN village TEXT NOT NULL DEFAULT '';
CREATE INDEX suggestions_city_village_idx ON suggestions (city, village);
