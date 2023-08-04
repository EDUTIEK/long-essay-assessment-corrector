<script setup>
  import {useCommentsStore} from "@/store/comments";
  import { useSummaryStore } from '@/store/summary';
  import { usePagesStore } from '@/store/pages';
  
  import createImageMarker from 'long-essay-image-marker/ImageMarker';
  import createMark, { SHAPES } from 'long-essay-image-marker/Mark';
  import Comment from "@/data/Comment";
  import { onMounted, nextTick, watch, ref, reactive } from 'vue';
  import bgb from '@/assets/bgb-hand.png';

  const commentsStore = useCommentsStore();
  const summaryStore = useSummaryStore();
  const pagesStore = usePagesStore();

  const markerNode = ref();


  const defaultShape = ref(SHAPES.RECTANGLE);
  const zoomLevel = ref(1);
  const mod = ref('draw');

  const defaults = reactive({
      data: {
          color: '#D8E5F4AA',
          selectedColor: '#94C3FCAA',
          shape: SHAPES.RECTANGLE,
          zoomLevel: 1,
          mode: 'draw'
      }
  });

  let marker;
  let currentKeys = [];


  onMounted(() => {
      marker = createImageMarker(markerNode.value, onCreation, onSelection);
      showPage(pagesStore.minPage);

      marker.setDefaultColor('#3365ffaa');
      marker.setDefaultSelectedColor('#3365ffaa');

      marker.setDefaultShape(SHAPES.RECTANGLE);
      marker.drawMode();
  });

  /**
   * Callback for creation
   * @param {Mark} created
   */
  async function onCreation(created) {
      if (!!created && !summaryStore.isAuthorized) {
          let comment = new Comment({
              start_position: created.pos.y,
              end_position: created.pos.y,
              parent_number: pagesStore.selectedPageNo,
              mark_key: created.key,
              mark_shape: created.shape,
              mark_pos: created.pos,
              mark_end: created.end,
              mark_width: created.width,
              mark_height: created.height,
              mark_polygon: created.polygon
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

        currentKeys = [];
        refreshMarks();
      }
    }
  }

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
          if (comment.parent_number == pagesStore.selectedPageNo && !!comment.mark_key) {
              let mark = getMark(comment);
              if (currentKeys.includes(mark.key)) {
                  marker.updateMark(mark);
              } else {
                  marker.addMark(mark);
              }
              if (comment.key == commentsStore.selectedKey) {
                  marker.selectMark(mark.key);
              }
              newKeys.push(mark.key);
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
   * Get the mark from a comment
   * @param comment
   * @return {?Mark}
   */
  function getMark(comment)
  {
      if (!!comment.mark_key) {
          return {
            key: comment.mark_key,
            label: comment.key == commentsStore.selectedKey ? comment.label : '',
            color: getColor(comment),
            selectedColor: getSelectedColor(comment),
            shape: comment.mark_shape,
            pos: comment.mark_pos,
            end: comment.mark_end,
            width: comment.mark_width,
            height: comment.mark_height,
            polygon: comment.mark_polygon
          }
      }
      return null;
  }

  /**
   * Get the background color for the text field of a comment
   * @param comment
   * @return {string}
   */
  function getColor(comment) {

    const filled = (comment.mark_shape == Comment.SHAPE_CIRCLE || comment.mark_shape == Comment.SHAPE_POLYGON || comment.mark_shape == Comment.SHAPE_RECTANGLE);

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
  function getSelectedColor(comment) {
    
    const filled = (comment.mark_shape == Comment.SHAPE_CIRCLE || comment.mark_shape == Comment.SHAPE_POLYGON || comment.mark_shape == Comment.SHAPE_RECTANGLE);
    
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

  function zoomIn() {
      zoomLevel.value += 0.1;
      marker.setZoomLevel(zoomLevel.value);
  }

  function zoomOut() {
      zoomLevel.value = Math.max(0, zoomLevel.value - 0.1);
      marker.setZoomLevel(zoomLevel.value);
  }

  function setShape() {
      if (defaultShape.value == 'scroll') {
          marker.scrollMode();
      }
      else {
          marker.setDefaultShape(defaultShape.value);
          marker.drawMode();
      }
  }


</script>

<template>
    <div id="app-essay-image-wrapper">
        <div class = "appImageButtons">

          <v-btn-group variant="outlined" divided>
            <v-btn icon="mdi-menu-left" @click="prevPage()"></v-btn>
            <v-btn>{{pagesStore.selectedPageNo}}</v-btn>
            <v-btn icon="mdi-menu-right" @click="nextPage()"></v-btn>
          </v-btn-group>

          &nbsp;
          
          <v-btn-group variant="outlined" divided>
                <v-btn icon="mdi-magnify-minus-outline" @click="zoomOut()"></v-btn>
                <v-btn icon="mdi-magnify-plus-outline" @click="zoomIn()"></v-btn>
            </v-btn-group>

            &nbsp;

            <v-btn-toggle variant="outlined" divided v-model="defaultShape" @click="setShape()">
                <v-btn icon="mdi-cursor-move" value="scroll"></v-btn>
                <v-btn icon="mdi-minus" :value="SHAPES.LINE"></v-btn>
                <v-btn icon="mdi-wave" :value="SHAPES.WAVE"></v-btn>
                <v-btn icon="mdi-circle-medium" :value="SHAPES.CIRCLE"></v-btn>
                <v-btn icon="mdi-rectangle-outline" :value="SHAPES.RECTANGLE"></v-btn>
                <v-btn icon="mdi-vector-triangle" :value="SHAPES.POLYGON"></v-btn>
            </v-btn-toggle>

        </div>
        <div class="appImageMarker" ref="markerNode"></div>
    </div>
</template>

<style scoped>

  #app-essay-image-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
  }

  .appImageButtons {
  }

  .appImageMarker {
      flex-grow: 1;
      width: 100%;
  }



</style>
