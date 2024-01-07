const SongSelector = {
  template: '#song-selector-template',
  setup() {
    const props = {
      active: ref(false),
      query: ref(''),
      songs: reactive({}),
      selected: ref(''),
    }

    return props;
  },
  mounted() {
    fetch('http://songs.magnusso.nz')
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(json => {
      Object.assign(this.songs,json);
    })
    .catch(console.error);
  },
  computed: {
    filteredGhs() {
      return this.filter(this.songs['ghs'], this.query);
    },
    filteredCcli() {
      return this.filter(this.songs['ccli'], this.query);
    }
  },
  methods: {
    open(song, index) {
      this.songEl = song;
      this.slotIndex = index;
      this.active = true;
    },
    filter(obj, query) {
      if (query === '') {
        return obj;
      } else {
        return obj.filter(val => val.toLowerCase().indexOf(query.toLowerCase()) > -1);
      }
    },

    ok() {
      this.songEl.slotNames.value[this.slotIndex] = this.selected;
      this.songEl.updateSlotName(this.slotIndex);
      this.active = false;
    }
  }
}