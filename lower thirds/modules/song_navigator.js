const App = {
  template: '#app-template',
  setup() {
    const props = {
      songPath: ref(''),
      song: reactive({ablauf: [], lyrics: {}}),
      order: reactive(['Titel']),
      row: ref(0),
      metaDelimiter: ';',
      activePart: ref(0),
      maxLineLength: 50,
    };

    const storables = {
      activeTheme: ['slt-theme', 'dark'],
    };

    // prepare properties
    Object.keys(storables).forEach(key => {
      storables[key] = reactive(new Readable(...storables[key]));
    });

    $('head').append('<link rel="stylesheet" href="../common/css/themes/' + storables.activeTheme.value + '/theme.css"/>');
  
    return {...props, ...storables};
  },
  mounted() {
    $( "#sortable" ).sortable({items: ".song-part", axis: "x"});
    $( "#sortable" ).on("sortupdate", this.updateSortOrder);
    $( "#sortable" ).disableSelection();

    this.bc = new BroadcastChannel('obs-animated-lower-thirds'); //Send to browser source
    this.bc.onmessage = this.bcHandler;
  },
  computed: {
    meta() {
      let meta = '';

      if (this.song.ccli) 
        meta = this.appendMeta(meta, 'CCLI: ' + this.song.ccli);
      if (this.song['text und melodie'])
        meta = this.appendMeta(meta, 'Text und Melodie: ' + this.song['text und melodie']);
      else {
        if (this.song.text)
          meta = this.appendMeta(meta, 'Text: ' + this.song.text);
        if (this.song.melodie)
          meta = this.appendMeta(meta, 'Melodie: ' + this.song.melodie);
      }
      if (this.song.satz)
        meta = this.appendMeta(meta, 'Satz: ' + this.song.satz);
      if (this.song.c)
        meta = this.appendMeta(meta, '© ' + this.song.c);

      return meta;
    }
  },
  methods: {
    updateSortOrder() {
      const sorted = $('#sortable').sortable("toArray").map((v, i) => this.order[i]);

      this.order.splice(0, Infinity, ...sorted);
    },
    loadSong() {
      fetch('https://songs.magnusso.nz/api/?path=' + this.songPath).then(res => {
        if (res.ok) {
          res.json()
            .then(json => {
              Object.assign(this.song, json);
              this.resetOrder();
              this.splitLines();
            });
        }
      });
    },
    splitLines() {
      this.song['splittedLyrics'] = {};
      Object.keys(this.song.lyrics).forEach(part => {
        // const words = this.song.lyrics[part].split(' ');
        // const lines = [''];
        // let i = 0;
        // let currLen = 0;

        // words.forEach(w => {
        //   if (currLen + w.length < this.maxLineLength) {
        //     currLen += w.length + 1;
        //     lines[i] += w + ' ';
        //   } else {
        //     currLen = w.length + 1;
        //     lines.push(w + ' ');
        //     i++;
        //   }
        // });

        // this.song.splittedLyrics[part] = lines;
        this.song.splittedLyrics[part] = this.song.lyrics[part].split('\n').map(val => val.trim());
      });
    },
    appendMeta(meta, newString) {
      if (meta.length > 0) meta += this.metaDelimiter + ' ';
      meta += newString;
      return meta;
    },
    resetOrder() {
      this.order.splice(1);
      this.song.ablauf.forEach(item => {
        this.order.push(item);
      });
      this.activePart = 0;
      this.row = 0;
      this.send();
    },
    loadPart(index) {
      this.activePart = index;
      this.row = 0;
      this.send();
    },
    removePart(index) {
      this.order.splice(index, 1);
    },
    lineUp() {
      this.row--;
      if (this.row < 0) {
        this.activePart = Math.max(0, this.activePart - 1);
        this.row = 0;
      }

      this.send();
    },
    lineDown() {
      const part = this.order[this.activePart];
      const lyrics = this.song.splittedLyrics[part];
      this.row++;

      if (lyrics && this.activePart > 0 && this.row >= lyrics.length) {
        this.activePart = Math.min(this.order.length, this.activePart + 1);
        this.row = 0;
      } else if (this.activePart == 0) {
        this.row = 0;
        this.activePart = 1;
      } else if (!lyrics && this.activePart > 0) {
        this.row = 0;
      }

      this.send();
    },
    bcHandler(msg) {
      if (msg.data.updateSlot) {
        this.songPath = msg.data.slotValues[0]['name'];
        console.log(this.songPath);
        this.loadSong();
      }
    },
    send() {
      // values that should be communicated:
      //      * current logo, name, and info
      const slotValues = {};

      if (this.activePart == 0) {
        slotValues['name'] = this.song.titel;
        slotValues['info'] = this.meta;
      } else if (this.activePart >= this.order.length) {
        slotValues['name'] = '';
        slotValues['info'] = '';
      } else {
        slotValues['name'] = this.song.splittedLyrics[this.order[this.activePart]][this.row];
        slotValues['info'] = '';
      }
      
      this.bc.postMessage({
        lyrics: true,
        slotValues
      });
    }
  }
};