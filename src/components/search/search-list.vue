<template>
    <div class="search-list">
        <transition-group name="list" tag="ul">
            <li class="search-item"
            v-for="item in searches"
            :key="item"
            @click="selectItem(item)">
                <span class="text">{{item}}</span>
                <span class="icon" @click.stop="deleteItem(item)"
                v-if="showDelete">
                    <i class="icon-delete"></i>
                </span>
            </li>
        </transition-group>
    </div>
</template>

<script>
export default {
    name: 'search-list',
    props: {
        searches: {
            type: Array,
            default() {
                return []
            }
        },
        showDelete: {
            type: Boolean,
            default: true
        }
    },
    emits: ['select', 'delete'],
    setup(props, { emit }) {
        function selectItem(item) {
            emit('select', item)
        }
        function deleteItem(item) {
            emit('delete', item)
        }
        return {
            selectItem,
            deleteItem
        }
    }
}
</script>

<style lang="scss" scoped>
  .search-list {
    .search-item {
      display: flex;
      align-items: center;
      height: 40px;
      overflow: hidden;
      .text {
        flex: 1;
        color: $color-text-l;
      }
      .icon {
        @include extend-click();
        .icon-delete {
          font-size: $font-size-small;
          color: $color-text-d;
        }
      }
    }
  }
</style>
