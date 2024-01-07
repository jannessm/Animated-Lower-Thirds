const Song = {
  template: '#song-template',
  props: ['index', 'fonts'],
  setup(args) {
    const props = {
      active: ref(false),
      inactive: ref(false),
      switchOn: ref(false),
      previewOn: ref(false),
      
      enabledPreview: ref(false),
      switchLeft: ref(false),
      hiddenSlotNumbers: ref(false),
      
      nameClicks: ref(0),
      nameIsEditable: ref(false),

      showStyleSettings: ref(false),

      activeTimeMonitor: ref(0),
      inactiveTimeMonitor: ref(0),

      slotTimeout: ref(),
      slotIsDelete: ref(Array.from({length: 10}, () => false)),

      jscolorConfig: ref(JSCOLOR_CONFIG),
      storables: [],
    };

    const storables = {
      slotIndex: [`slt-${args.index}-active-slot`, 0],
      title: [`slt-${args.index}-title`, `Lower Third ${args.index + 1}`],
      style: [`slt-${args.index}-style`, 1],
      autoTrigger: [`slt-${args.index}-auto-trigger`, false],
      autoLoad: [`slt-${args.index}-auto-load`, false],
      
      customTimeSettings: [`slt-${args.index}-custom-time-settings`, false],
      animationTime: [`slt-${args.index}-animation-time`, ''],
      activeTime: [`slt-${args.index}-active-time`, ''],
      lockActive: [`slt-${args.index}-lock-active`, false],
      inactiveTime: [`slt-${args.index}-inactive-time`, ''],
      oneShot: [`slt-${args.index}-one-shot`, false],
      
      align: [`slt-${args.index}-align`, 'left'],
      size: [`slt-${args.index}-size`, 24],
      marginH: [`slt-${args.index}-margin-h`, 4],
      marginV: [`slt-${args.index}-margin-v`, 4],
      inverseRatio: [`slt-${args.index}-inverse-ratio`, 9],
      lineSpacing: [`slt-${args.index}-line-spacing`, 0],
      font: [`slt-${args.index}-font`, 'Open Sans, sans-serif'],
      
      shadows: [`slt-${args.index}-shadows`, false],
      shadowAmount: [`slt-${args.index}-shadow-amount`, 5],

      background: [`slt-${args.index}-background`, true],
      backgroundColor1: [`slt-${args.index}-background-color-1`, '#D54141'],
      backgroundColor2: [`slt-${args.index}-background-color-2`, '#222222'],

      corners: [`slt-${args.index}-corners`, 0],

      borders: [`slt-${args.index}-borders`, false],
      borderThickness: [`slt-${args.index}-border-thickness`, 4],
      bordersColor1: [`slt-${args.index}-borders-color-1`, '#D54141'],
      bordersColor2: [`slt-${args.index}-borders-color-2`, '#222222'],

      nameTransform: [`slt-${args.index}-name-transform`, true],  // uppercase | normal
      nameBold: [`slt-${args.index}-name-bold`, true],            // lighter | bold
      nameItalic: [`slt-${args.index}-name-italic`, false],       // normal | italic
      nameColor: [`slt-${args.index}-name-color`, '#F2F2F2'],

      infoTransform: [`slt-${args.index}-info-transform`, true],
      infoBold: [`slt-${args.index}-info-bold`, true],
      infoItalic: [`slt-${args.index}-info-italic`, false],
      infoColor: [`slt-${args.index}-info-color`, '#8A8A8A'],

      slotNames: [`slt-${args.index}-slot-names`, Array.from({length: 10}, () => '')],
    };

    // prepare properties
    Object.keys(storables).forEach(key => {
      storables[key] = reactive(new Storable(...storables[key]));
      props.storables.push(key);
    });

    return {...storables, ...props};
  },
  mounted() {
    //expand timeSettings if customTimeSettings = true;
    const timeSettings = this.$el.querySelector(`#time-settings-${this.index}`);
    if (!this.customTimeSettings.value) {
      timeSettings.style.maxHeight = '0px';
    } else {
      timeSettings.style.maxHeight = timeSettings.scrollHeight + 'px';
    }

    jscolor.install();

    setTimeout(() => {
      if (!!this.slotNames.value[0])
        this.loadSlot(0);
    }, 100);
  },
  methods: {
    nameClickHandler() {
      if (this.nameClicks == 0) {
        this.nameClicks++;
        setTimeout(function() {
          this.nameClicks = 0;
        }, 500);
      } else {
        this.nameIsEditable = true;
        const inp = this.$el.querySelector('.drag-handle .settings-inputs input');
        setTimeout(() => {
          inp.focus();
        }, 1);
      }
    },
    toggleStyleSettings() {
      this.showStyleSettings = !this.showStyleSettings;
      const styleSettings = this.$el.querySelector(`#style-settings-${this.index}`);

      if (!this.showStyleSettings) {
        styleSettings.style.maxHeight = '0px';
      } else {
        styleSettings.style.maxHeight = styleSettings.scrollHeight + 'px';
      }
    },
    toggleTimeSettings() {
      this.customTimeSettings.value = !this.customTimeSettings.value;
      const timeSettings = this.$el.querySelector(`#time-settings-${this.index}`);

      if (!this.customTimeSettings.value) {
        timeSettings.style.maxHeight = '0px';
      } else {
        timeSettings.style.maxHeight = timeSettings.scrollHeight + 'px';
      }
    },
    stepUp(value, max) {
      value.value = Math.min(value.value + 1, max);
      this.$emit('styleChanged');
    },
    stepDown(value, min) {
      value.value = Math.max(value.value - 1, min);
      this.$emit('styleChanged');
    },
    restrictStyles() {
      if (this.style.value == 1 && this.align.value == 'center') {
        this.align.value = 'left';
        this.$emit('styleChanged');
      }
    },
    clearInputs() {
      this.name.value = '';
    },
    selectSong(index) {
      this.$emit('openSongSelect', {song: this, index});
    },
    slotIsStored(index) {
      return this.slotNames.value[index] !== '';
    },
    updateSlotName(index) {
      this.slotNames.update();

      if (index == this.slotIndex.value) {
        this.$emit('slotChanged');
      }
    },
    loadSlot(index) {
      this.slotIndex.value = index;

      if (this.autoTrigger.value) {
        this.switchOn = true;
        this.$emit('switchChanged');
      }

      this.$emit('slotChanged');
    },
    clearSlot(index) {
      this.slotNames.value[index] = '';
      this.slotNames.update();
    },
    slotLoadNext() {
      // if no slot was loaded and no slot is stored => do nothing
      // if no slot was loaded and no slot is active => load first stored
      // if no slot was loaded => assume that first active slot is current slot and load next
      
      const storedSlots = Array.from({length: 10}, (v, i) => this.slotIsStored(i));

      // if slotIndex is -1 search for first active or stored if no active is found
      if (this.slotIndex.value == -1) {
        const firstActive = Array.from({length: 10}, (v, i) => this.slotIsActive(i)).indexOf(true);
        const firstStored = storedSlots.indexOf(true);
        
        if (firstActive < 0 && firstStored < 0) {
          return;
        } else {
          this.loadSlot(storedSlots.indexOf(true, firstActive + 1));
        }
      } else {
        let nextSlot = storedSlots.indexOf(true, this.slotIndex.value + 1);

        if (nextSlot < 0) {
          // is >= 0 because a slot is loaded :)
          nextSlot = storedSlots.indexOf(true);
        }
        this.loadSlot(nextSlot);
      }
    }
  }
}