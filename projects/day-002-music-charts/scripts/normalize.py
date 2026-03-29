"""Central data normalization rules for all exports and visualizations.

Import this module from any export/analysis script to get consistent data.
"""

# Artists to exclude (audiobooks, podcasts, non-music)
EXCLUDE_ARTISTS = {
    "Perry Rhodan", "Clark Darlton", "Terry Pratchett", "LEGO Ninjago",
    "Astrid Lindgren Deutsch", "Astrid Lindgren", "Vaiana", "Janosch", "Michel",
    "Kinder Hörspiel", "Pumuckl", "Angela Sommer-Bodenburg", "Yakari",
    "Pettersson und Findus", "Winnie Puuh Hörspiel", "Winnie Puuh",
    "Der Grüffelo", "Toy Story", "Michael Ende", "Pippi Langstrumpf",
    "Woozle Goozle", "DIE PLAYMOS", "Planes", "Prof. Dr. Anne Reichold",
    "Die drei ???", "Die drei ??? Kids", "Wolfgang Korn", "Wolfgang Hohlbein",
}

# Artist name normalization: merge variants to canonical name
ARTIST_MERGES = {
    "A Silver Mt. Zion": "Silver Mt. Zion",
    "A Silver Mt Zion": "Silver Mt. Zion",
    "Silver Mt Zion": "Silver Mt. Zion",
    "a silver mount zion": "Silver Mt. Zion",
    "Jose Gonzalez": "José González",
    "Notwist": "The Notwist",
    "End.user": "Enduser",
    "End.User": "Enduser",
    "Future Sound Of London": "The Future Sound of London",
    "The Future Sound Of London": "The Future Sound of London",
    "Ellen Alien": "Ellen Allien",
    "The Gossip": "Gossip",
    "Sisters of Mercy": "The Sisters of Mercy",
    "D.A.F.": "DAF",
    "SLAUSON MALONE 1": "Slauson Malone 1",
    "Slauson Malone": "Slauson Malone 1",
    "Xmal Deutschland": "X-Mal Deutschland",
    "N.W.A": "N.W.A.",
    "Fliehende St?rme": "Fliehende Stürme",
    "Sigur Ros": "Sigur Rós",
    "Zoe Keating": "Zoë Keating",
    "Chemical Brothers": "The Chemical Brothers",
    "MC 900 Ft Jesus": "MC 900 Ft. Jesus",
    "Desmond Dekker & The Aces": "Desmond Dekker",
    "Throw That Beat In The Garbagecan": "Throw That Beat In The Garbagecan!",
    "Dick Dale and His Del-Tones": "Dick Dale & His Del-Tones",
    "Absolute Beginner": "Beginner",
    "Dave Brubeck": "The Dave Brubeck Quartet",
    "Telepopmusik": "Télépopmusik",
    "Sharon Jones and the Dap-Kings": "Sharon Jones & The Dap-Kings",
    "Emiliana Torrini": "Emilíana Torrini",
    "Smiths": "The Smiths",
    "WestBam": "Westbam",
    "Westbam/ML": "Westbam",
    "Ventures": "The Ventures",
    "Clanad": "Clannad",
    "Kristoffer & The Harbourheads": "Kristoffer And The Harbour Heads",
    "163_PLASTIC BERTRAND": "Plastic Bertrand",
    "Kenny Rogers & The First Edition": "The First Edition",
    "Murmurs": "The Murmurs",
    "Cat Stevens": "Yusuf / Cat Stevens",
    "Echo And The Bunnymen": "Echo & the Bunnymen",
    "The Aphex Twin": "Aphex Twin",
    "Simon and Garfunkel": "Simon & Garfunkel",
    "Grandmaster Flash & Melle Mel": "Grandmaster Flash",
    "Shakespear's Sister": "Shakespears Sister",
    "The Kilimanjaro Darkjazz Ensem": "The Kilimanjaro Darkjazz Ensemble",
    "Meanwhile Back In Communist Russia": "Meanwhile, Back in Communist Russia...",
    "boards of canada - geogaddi": "Boards of Canada",
    "Michael Vitner's Incredible Bongo Band": "Incredible Bongo Band",
    "Alarm Will Sound performs Aphex Twin": "Alarm Will Sound",
    "Crazy World Of Arthur Brown": "Arthur Brown",
    "The Prodigy - Topic": "The Prodigy",
}

# Track renames: fix mis-scrobbles, merge duplicates
# Format: (track_name, artist_name) -> (new_track_name, new_artist_name)
# Applied AFTER artist merges
TRACK_RENAMES = {
    ("In diesem Video", "Ninajirachi"): ("iPod Touch", "Ninajirachi"),
    ("In diesem Video", "Ninajirachi & daine - It's You (underscores'"): ("iPod Touch", "Ninajirachi"),
    ("In diesem Video", "Ninajirachi & daine"): ("iPod Touch", "Ninajirachi"),
    ("Dorephin Shopping Center", "Rhythm* Pocket!:"): ("Dorephin Shopping Center", "Azikazin Magic World"),
}


def normalize_artist(name):
    """Normalize an artist name using merge rules."""
    return ARTIST_MERGES.get(name, name)


def normalize_listen(listen):
    """Normalize a listen dict in-place. Returns False if it should be excluded."""
    if listen["ar"] in EXCLUDE_ARTISTS:
        return False
    listen["ar"] = normalize_artist(listen["ar"])
    key = (listen["tr"], listen["ar"])
    if key in TRACK_RENAMES:
        listen["tr"], listen["ar"] = TRACK_RENAMES[key]
    return True
