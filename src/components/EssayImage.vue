<script setup>
  import { useApiStore } from '@/store/api';
  import { useCommentsStore } from "@/store/comments";
  import { useSummariesStore } from '@/store/summaries';
  import { usePagesStore } from '@/store/pages';
  import { useLayoutStore } from '@/store/layout';

  // temporary dependencies for development
  // import createImageMarker from '@/dev/long-essay-image-marker/ImageMarker';
  // import createMark, { SHAPES } from '@/dev/long-essay-image-marker/Mark';
  
  // normal dependencies as node modules
  import createImageMarker from 'long-essay-image-marker/ImageMarker';
  import createMark, { SHAPES } from 'long-essay-image-marker/Mark';
  
  import Comment from "@/data/Comment";
  import Mark from '@/data/Mark';
  import { onMounted, nextTick, watch, ref, reactive } from 'vue';

  const apiStore = useApiStore();
  const commentsStore = useCommentsStore();
  const summariesStore = useSummariesStore();
  const pagesStore = usePagesStore();
  const layoutStore = useLayoutStore();
  
  const markerNode = ref();
  const selectedTool = ref('scroll');
  const pageMenuOpen = ref(false);
  const pageMenuInput = ref(0);
  const showLabels = ref(true);
  
  
  let marker;
  let shownUrl = '';
  let currentKeys = [];
  let selectedKey = null;


  onMounted(() => {
      marker = createImageMarker(markerNode.value, onCreation, onSelection);
      marker.setDefaultColor('#3365ffaa');
      marker.setDefaultSelectedColor('#3365ffaa');
      selectTool()
      showPage(pagesStore.minPage);
  });

  /**
   * Callback for creation
   * @param {Mark} created
   */
  async function onCreation(created) {
      if (!!created && !summariesStore.isOwnDisabled) {
        
          const mark = new Mark(created);
          switch (selectedTool.value) {
            case 'check':
              mark.symbol = Mark.SYMBOL_CHECK;
              break;
            case 'cross':
              mark.symbol = Mark.SYMBOL_CROSS;
              break;
            case 'question':
              mark.symbol = Mark.SYMBOL_QUESTION;
              break;
          }
          
          const comment = new Comment({
              parent_number: pagesStore.selectedPageNo,
              marks: [mark]
         });
          currentKeys.push(created.key);
          if (!commentsStore.getCommentByMarkKey(created.key)) {
              await commentsStore.addComment(comment);
          }
      }
  }

  /**
   * Callback for selection
   * @param {Mark} selected
   */
  function onSelection(selected) {     
      if (!!selected) {
          selectedKey = selected.key;
        
          let comment = commentsStore.getCommentByMarkKey(selected.key);
          if (comment) {
            commentsStore.selectComment(comment.key);
              const oldData = comment.getData();
              if (comment.corrector_key == apiStore.correctorKey && !summariesStore.isOwnDisabled) {
                // comment can be updated
                selected.symbol = selected.symbol == '' ? null : selected.symbol;
                comment.updateMarkData(selected);
                const newData = comment.getData();
                if (JSON.stringify(oldData) != JSON.stringify(newData)) {
                  commentsStore.updateComment(comment, true);
                }
                return;
              }
              else {
                // comment can't be updated, revert a mark change
                const mark = comment.getMarkByKey(selected.key);
                if (mark) {
                  const mark_data = {
                    ...mark.getData(),
                    label: showLabels.value ? comment.label : '',
                    color: comment.getMarkColor(mark),
                    selectedColor: comment.getMarkSelectedColor(mark),
                  }
                  marker.updateMark(mark_data);
                }
              }
          }
      }
      else {
        commentsStore.selectComment('');
      }
  }
  
  

  /**
   * Show a new page with the active marks on it
   * @param {integer} page
   */
  function showPage(page_no) {
    if (pagesStore.selectByPageNo(page_no)) {
      const page = pagesStore.getPageByPageNo(page_no);
      if (page) {
        if (page.objectUrl) {
          marker.showPage(page.objectUrl, []);
          shownUrl = page.objectUrl;
        }
        else {
          marker.showPage('' ?? '', []);
          shownUrl = '';
        }
        try {
          marker.setZoomLevel(layoutStore.essayPageZoom);
        }
        catch {
          // do nothing
        }
        document.querySelector('.long-essay-image-marker').scrollTop = 0;
        currentKeys = [];
        refreshMarks();
        pageMenuInput.value = page_no;
      }
    }
  }

  /**
   * Reload the page when the page image is available
   */
  function reloadPage() {
    const page = pagesStore.selectedPage;
    if (page && page.objectUrl != shownUrl) {
      showPage(page.page_no);
    }
  }
  watch(() => pagesStore.loadedImages, reloadPage);
  
  
  /**
   * Refresh by selection of a comment
   */
  function refreshSelection() {
    const comment = commentsStore.getComment(commentsStore.selectedKey);
    if (comment && comment.parent_number != pagesStore.selectedPageNo) {
      showPage(comment.parent_number);
    }
    refreshMarks();
  }
  watch(() => commentsStore.selectedKey, refreshSelection);

  /**
   * Refresh the display of marks on the page
   */
  function refreshMarks() {
    let newKeys = [];

    for (const comment of commentsStore.activeComments) {
      if (comment.parent_number == pagesStore.selectedPageNo) {
        for (const mark of comment.marks) {
          const mark_data = {
            ...mark.getData(),
            label: showLabels.value ? comment.label : '',
            color: comment.getMarkColor(mark),
            selectedColor: comment.getMarkSelectedColor(mark),
          }
          if (currentKeys.includes(mark.key)) {
            marker.updateMark(mark_data);
          } else {
            marker.addMark(mark_data);
          }
          newKeys.push(mark.key);
          if (comment.key == commentsStore.selectedKey) {
            if (mark.key != selectedKey) {
              marker.selectMark(mark.key);
              selectedKey = mark.key;
            }
          }
        }
      }
    }

    for (const key of currentKeys) {
      if (!newKeys.includes(key)) {
        marker.removeMark(key);
      }
    }
    currentKeys = newKeys;
  };
  watch(() => commentsStore.markerChange, refreshMarks);
  watch(() => commentsStore.filterKeys, refreshMarks);


  /**
   * Scroll the list of comments to the comments of the current page
   */
  function scrollComments() {
    let comments = commentsStore.getActiveCommentsByParentNumber(pagesStore.selectedPageNo);
    if (comments.length) {
      let comment = comments.shift();
      commentsStore.setFirstVisibleComment(comment.key);
    }
  }
  watch(() => pagesStore.selectedKey, scrollComments);
  
  
  function prevPage() {
    if (pagesStore.selectedPageNo > pagesStore.minPage) {
      showPage(pagesStore.selectedPageNo - 1);
    }
  }

  function nextPage() {
    if (pagesStore.selectedPageNo < pagesStore.maxPage) {
      showPage(pagesStore.selectedPageNo + 1);
    }
  }

  function selectPage(page_no) {
    pageMenuOpen.value = false;
    showPage(page_no);
  }

  async function updatePageMenu() {
    if (pageMenuOpen.value) {
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 250));
      const input = document.getElementById('app-pages-menu-input');
      input.select();
    }
  }

  function zoomIn() {
    layoutStore.zoomEssayPageIn();
    marker.setZoomLevel(layoutStore.essayPageZoom);
  }

  function zoomOut() {
    layoutStore.zoomEssayPageOut();
    marker.setZoomLevel(layoutStore.essayPageZoom);
  }

  function selectTool() {
    
    if (summariesStore.isOwnDisabled) {
      selectedTool.value = 'scroll';  
    }
    
    switch (selectedTool.value) {
      case 'scroll':
        marker.scrollMode();
        break;
        
      case 'rectangle':
        marker.drawMode();
        marker.setDefaultShape(SHAPES.RECTANGLE);
        break;
        
      case 'line':
        marker.drawMode();
        marker.setDefaultShape(SHAPES.LINE);
        break;

      case 'wave':
        marker.drawMode();
        marker.setDefaultShape(SHAPES.WAVE);
        break;

      case 'polygon':
        marker.drawMode();
        marker.setDefaultShape(SHAPES.POLYGON);
        break;

      case 'circle':
      case 'check':
      case 'cross':
      case 'question':
        marker.drawMode();
        marker.setDefaultShape(SHAPES.CIRCLE);
        break;
    }
  }

  function toggleLabels() {
    if (showLabels.value == 1) {
      showLabels.value = 0;
    }
    else {
      showLabels.value = 1;
    }
    refreshMarks();
  }

</script>

<template>
    <div id="app-essay-image-wrapper">
        <div class = "appImageButtons">


          <v-btn-group density="comfortable" variant="outlined" divided>
            <v-btn size="small" icon="mdi-magnify-minus-outline" @click="zoomOut()"></v-btn>
            <v-btn size="small" icon="mdi-magnify-plus-outline" @click="zoomIn()"></v-btn>
          </v-btn-group>

          &nbsp;

          <v-btn-toggle density="comfortable" variant="outlined" divided v-model="selectedTool" @click="selectTool()">
            <v-btn size="small" icon="mdi-cursor-move" value="scroll"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-minus" value="line"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-wave" value="wave"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-check" value="check"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-close" value="cross"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-help" value="question"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-rectangle-outline" value="rectangle"></v-btn>
            <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-vector-triangle" value="polygon"></v-btn>
          </v-btn-toggle>

          &nbsp;
          
          <v-btn-group density="comfortable" variant="outlined" divided>
            <v-btn size="small" :active="showLabels" icon="mdi-label-outline" @click="toggleLabels()"></v-btn>
          </v-btn-group>

          &nbsp;

          <v-btn-group density="comfortable" variant="outlined" divided>
            <v-btn size="small" icon="mdi-menu-left" @click="prevPage()"></v-btn>
            <v-btn size="small" id="app-pages-menu-activator">{{pagesStore.selectedPageNo}}</v-btn>
            <v-btn size="small" icon="mdi-menu-right" @click="nextPage()"></v-btn>
          </v-btn-group>



          <v-menu activator="#app-pages-menu-activator" v-model="pageMenuOpen" :close-on-content-click="false" @update:modelValue="updatePageMenu()">
            
            <v-list>
              <v-list-item>
                <v-text-field
                    id="app-pages-menu-input"
                    v-model="pageMenuInput"
                    density="compact"
                    variant="solo" 
                    label="Number"
                    single-line
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    @change="selectPage(pageMenuInput)"
                >
                </v-text-field>
    
              </v-list-item>
              <v-list-item v-for="page in pagesStore.currentPages"
                           @click="selectPage(page.page_no)"
                           :title="page.page_no"
                           :key="page.key">
                  <v-img v-show="page.thumbObjectUrl !== null" :src="page.thumbObjectUrl" width="100">
                  </v-img>
              </v-list-item>

            </v-list>
          </v-menu>

          
        </div>
      
      <div class="appImageMarker" ref="markerNode"></div>

      
      <div class="appImageBottomNav">
        <v-btn-group variant="outlined" divided>
          <v-btn :disabled="pagesStore.selectedPageNo <= pagesStore.minPage" size="small" icon="mdi-menu-left" @click="prevPage()"></v-btn>
          <v-btn :disabled="pagesStore.selectedPageNo >= pagesStore.maxPage" size="small" icon="mdi-menu-right" @click="nextPage()"></v-btn>
        </v-btn-group>
      </div>
      

    </div>
</template>

<style scoped>

  #app-essay-image-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
  }


  
  .appImageButtons {
    text-align: center;  
  }
  
  .appImageMarker {
    flex-grow: 1;
    width: 100%;
  }
  

  .appImageBottomNav {
    position: absolute;
    bottom: 5px;
    right: calc(50% + 40px);
  }

</style>
