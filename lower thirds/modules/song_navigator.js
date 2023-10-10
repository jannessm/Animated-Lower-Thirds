const App = {
  template: '#app-template',
  setup() {
    const props = {
      songPath: ref(''),
      song: reactive({ablauf: []}),
      order: reactive(['Titel']),
      name: ref(''),
      info: ref(''),
      row: ref(0),
      maxLineLength: 50,
      activePart: ref(0),
    };

    const storables = {
      activeTheme: ['alt2-theme', 'dark'],
      slotIndex: ['alt2-0-active-slot', 0],
      slotNames: [`alt2-0-slot-names`, Array.from({length: 10}, () => '')],
    };

    // prepare properties
    Object.keys(storables).forEach(key => {
      storables[key] = reactive(new Storable(...storables[key]));
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

    this.songPath = 'ghs/1. Ich singe dir mit Herz und Mund.txt';
    this.loadSong();
  },
  computed: {
    meta() {
      let meta = '';

      if (this.song.ccli) 
        meta = this.appendMeta(meta, 'CCLI: ' + this.song.ccli);
      if (this.song.text)
        meta = this.appendMeta(meta, 'Text: ' + this.song.text);
      if (this.song.melodie)
        meta = this.appendMeta(meta, 'Melodie: ' + this.song.melodie);
      if (this.song.satz)
        meta = this.appendMeta(meta, 'Satz: ' + this.song.satz);

      return meta;
    }
  },
  methods: {
    updateSortOrder() {
      const sorted = $('#sortable').sortable("toArray").map((v, i) => this.order[i]);

      this.order.splice(0, Infinity, ...sorted);
    },
    loadSong() {
      fetch('http://songs.magnusson.berlin?path=' + this.songPath).then(res => {
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
      Object.keys(this.song.lyrics).forEach(part => {
        const words = this.song.lyrics[part].split(' ');
        const lines = [''];
        let i = 0;
        let currLen = 0;

        words.forEach(w => {
          if (currLen + w.length < this.maxLineLength) {
            currLen += w.length + 1;
            lines[i] += w + ' ';
          } else {
            currLen = w.length + 1;
            lines.push(w + ' ');
            i++;
          }
        });

        this.song.lyrics[part] = lines;
      });
    },
    appendMeta(meta, newString) {
      if (meta.length > 0) meta += ', ';
      meta += newString;
      return meta;
    },
    resetOrder() {
      this.order.splice(1);
      this.song.ablauf.forEach(item => {
        this.order.push(item);
      });
      this.activePart = 0;
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
    },
    lineDown() {
      const part = this.order[this.activePart];
      this.row++;

      if (this.activePart > 0 && this.row >= this.song.lyrics[part].length) {
        this.activePart = Math.min(this.order.length, this.activePart + 1);
        this.row = 0;
      } else if (this.activePart == 0) {
        this.row = 0;
        this.activePart = 1;
      }
    },
    bcHandler(msg) {
      if (msg.data['updateSlot']) {
        this.slotIndex.update();
        this.slotNames.update();

        this.songPath = this.slotNames.value[this.slotIndex.value];
        this.loadSong();
      }
    },
      send() {
          // values that should be communicated:
          //      * which switches are on
          //      * which previews are on
          //      * aggregated times (animation, active, inactive)
          //      * values that are calculated from
          //      * current logo, name, and info
          console.log('send');
          this.sendStyleUpdate();

          const main = this.$refs.mainSettings;

          
          const switchStates = Object.values(this.$refs.lt)
                                     .map(lt => lt.switchOn && main.active.value);
          const previewStates = Object.values(this.$refs.lt)
                                      .map(lt => lt.previewOn);

          const animationTimes = Object.values(this.$refs.lt)
                                      .map(lt => lt.animationTime.value || main.animationTime.value);
          const activeTimes = Object.values(this.$refs.lt)
                                      .map(lt => {
                                      if (lt.customTimeSettings && lt.lockActive.value) {
                                          return Infinity;
                                      } else if (!lt.customTimeSettings && main.lockActive.value) {
                                          return Infinity;
                                      } else if (lt.customTimeSettings && lt.activeTime.value){
                                          return lt.activeTime.value
                                      } else {
                                          return main.activeTime.value;
                                      }
                                      });
          const inactiveTimes = Object.values(this.$refs.lt)
                                      .map(lt => {
                                          if (lt.customTimeSettings && lt.oneShot.value) {
                                              return Infinity;
                                          } else if (!lt.customTimeSettings && main.oneShot.value) {
                                              return Infinity;
                                          } else if (lt.customTimeSettings && lt.inactiveTime.value){
                                              return lt.inactiveTime.value
                                          } else {
                                              return main.inactiveTime.value;
                                          }
                                      });
          const slotValues = Object.values(this.$refs.lt)
              .map(lt => {
                  return {
                      name: lt.slotNames.value[lt.slotIndex.value],
                      info: lt.slotInfos.value[lt.slotIndex.value],
                      logoSrc: lt.logoSrc,
                  }
              });
          
          this.bc.postMessage({
              switchStates, previewStates, animationTimes, activeTimes, inactiveTimes, slotValues
          });
      },
      sendStyleUpdate() {
          this.bc.postMessage({ updateStyles: true });
      },
      sendSlotUpdate() {
          console.log('send slot update');
          const slotValues = Object.values(this.$refs.lt)
              .map(lt => {
                  return {
                      name: lt.slotNames.value[lt.slotIndex.value],
                      info: lt.slotInfos.value[lt.slotIndex.value],
                      logoSrc: lt.logoSrc,
                  }
              });
          this.bc.postMessage({ updateSlot: true, slotValues });
      },
  }
};