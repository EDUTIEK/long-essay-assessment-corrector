<script setup>
  import {useCommentsStore} from "@/store/comments";
  import { useSummariesStore } from '@/store/summaries';
  import { usePagesStore } from '@/store/pages';
  
  import createImageMarker from 'long-essay-image-marker/ImageMarker';
  import createMark, { SHAPES } from 'long-essay-image-marker/Mark';
  import Comment from "@/data/Comment";
  import Mark from '@/data/Mark';
  import { onMounted, nextTick, watch, ref, reactive } from 'vue';

  const commentsStore = useCommentsStore();
  const summariesStore = useSummariesStore();
  const pagesStore = usePagesStore();
  
  const markerNode = ref();
  const selectedTool = ref('rectangle');
  const zoomLevel = ref(1);
  
  let marker;
  let currentKeys = [];


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
      if (!!created && !summariesStore.isOwnAuthorized) {
        
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
      if (selected) {
          let comment = commentsStore.getCommentByMarkKey(selected.key);
          if (comment) {
              commentsStore.selectComment(comment.key);
              return;
          }
      }
      commentsStore.selectComment('');
  }
  
  

  /**
   * Show a new page with the active marks on it
   * @param {integer} page
   */
  function showPage(page_no) {
    if (pagesStore.selectByPageNo(page_no)) {
      const page = pagesStore.getPageByPageNo(page_no);
      if (page) {
        marker.showPage(page.url, []);
        try {
          marker.setZoomLevel(zoomLevel.value);
        }
        catch {
          // do nothing
        }
        document.querySelector('.long-essay-image-marker').scrollTop = 0;
        currentKeys = [];
        refreshMarks();
      }
    }
  }

  /**
   * Reload the page when the page image is available
   */
  function reloadPage() {
    if (pagesStore.pagesLoaded) {
      showPage(pagesStore.selectedPageNo);
    }
  }
  watch(() => pagesStore.pagesLoaded, reloadPage);
  
  
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
            label: comment.label,
            // label: comment.key == commentsStore.selectedKey ? comment.label : '',
            color: getColor(comment, mark.shape),
            selectedColor: getSelectedColor(comment, mark.shape),
          }
          if (currentKeys.includes(mark.key)) {
            marker.updateMark(mark_data);
          } else {
            marker.addMark(mark_data);
          }
          newKeys.push(mark.key);
          if (comment.key == commentsStore.selectedKey) {
            marker.selectMark(mark.key);
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
  

  /**
   * Get the background color for the text field of a comment
   * @param comment
   * @return {string}
   */
  function getColor(comment, shape) {

    const filled = (shape == Mark.SHAPE_CIRCLE || shape == Mark.SHAPE_POLYGON || shape == Mark.SHAPE_RECTANGLE);

    let color = '';
    if (comment.prefix == 'own') {
      if (comment.rating_excellent) {
        return filled ?  '#E3EFDDAA' : '#19e62e';
      } else if (comment.rating_cardinal) {
        return filled ? '#FBDED1AA' : '#bc4710';
      } else {
        return filled ? '#D8E5F4AA' : '#3365ff';
      }
    } else {
      if (comment.rating_excellent) {
        return filled ? '#F7F9F7AA' : '#19e62e';
      } else if (comment.rating_cardinal) {
        return filled ? '#FCF6F4AA' : '#bc4710';
      } else {
        return filled ? '#F5F7FBAA' : '#3365ff';
      }
    }
  }

  /**
   * Get the background color for the text field of a comment
   * @param comment
   * @return {string}
   */
  function getSelectedColor(comment, shape) {
    
    const filled = (shape == Mark.SHAPE_CIRCLE || shape == Mark.SHAPE_POLYGON || shape == Mark.SHAPE_RECTANGLE);
    
    if (comment.rating_excellent) {
      return filled ? '#BBEBA5AA' : '#19e62e';
    } else if (comment.rating_cardinal) {
      return filled ? '#FCB494AA' : '#bc4710';
    } else {
      return filled ? '#94C3FCAA' : '#3365ff';
    }
  }

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
    showPage(page_no);
  }


  function zoomIn() {
      zoomLevel.value += 0.1;
      marker.setZoomLevel(zoomLevel.value);
  }

  function zoomOut() {
      zoomLevel.value = Math.max(0, zoomLevel.value - 0.1);
      marker.setZoomLevel(zoomLevel.value);
  }

  function selectTool() {
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
            <v-btn size="small" icon="mdi-minus" value="line"></v-btn>
            <v-btn size="small" icon="mdi-wave" value="wave"></v-btn>
            <v-btn size="small" icon="mdi-check" value="check"></v-btn>
            <v-btn size="small" icon="mdi-close" value="cross"></v-btn>
            <v-btn size="small" icon="mdi-help" value="question"></v-btn>
            <v-btn size="small" icon="mdi-rectangle-outline" value="rectangle"></v-btn>
            <v-btn size="small" icon="mdi-vector-triangle" value="polygon"></v-btn>
          </v-btn-toggle>

          &nbsp;

          <v-btn-group density="comfortable" variant="outlined" divided>
            <v-btn size="small" icon="mdi-menu-left" @click="prevPage()"></v-btn>
            <v-btn size="small" id="app-pages-menu-activator">{{pagesStore.selectedPageNo}}</v-btn>
            <v-btn size="small" icon="mdi-menu-right" @click="nextPage()"></v-btn>
          </v-btn-group>



          <v-menu activator="#app-pages-menu-activator">
            <v-list>
              <v-list-item v-for="page in pagesStore.pages"
                           @click="selectPage(page.page_no)"
                           :title="page.page_no"
                           :key="page.key">
                  <v-img :src="page.thumb_url" width="100">
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
